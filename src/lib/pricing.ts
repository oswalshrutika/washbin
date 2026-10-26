/**
 * Price calculation shared by the booking UI (live breakdown) and the server (authoritative total).
 * Pure: no DB or request access. All amounts are integer paise.
 */

import { PAYMENT, PRICING, type PaymentOption } from "@/config/business";

export type CatalogVariant = {
  id: number;
  name: string;
  group: string | null;
  price: number;
  durationMinutes: number;
  unitLabel: string | null;
  maxQty: number;
};

export type CatalogAddon = {
  id: number;
  name: string;
  price: number;
  durationMinutes: number;
  maxQty: number;
};

export type CatalogService = {
  id: number;
  slug: string;
  name: string;
  icon: string;
  washers: number;
  priceMayChangeOnSite: boolean;
  variants: CatalogVariant[];
  addons: CatalogAddon[];
};

export type CartLine = {
  serviceId: number;
  variantId: number;
  qty: number;
  addons: { addonId: number; qty: number }[];
};

/** A coupon that has already passed the eligibility checks that need the DB (expiry, usage, first booking). */
export type ApplicableCoupon = {
  code: string;
  type: "percent" | "flat";
  value: number;
  maxDiscount: number | null;
  minOrder: number;
  serviceId: number | null;
};

export type QuoteLine = {
  serviceId: number;
  kind: "variant" | "addon";
  variantId: number | null;
  addonId: number | null;
  name: string;
  unitPrice: number;
  qty: number;
  amount: number;
  durationMinutes: number;
};

export type Quote = {
  lines: QuoteLine[];
  subtotal: number;
  visitCharge: number;
  discount: number;
  couponCode: string | null;
  couponError: string | null;
  tax: number;
  total: number;
  durationMinutes: number;
  washers: number;
  priceMayChangeOnSite: boolean;
};

export class QuoteError extends Error {}

export function variantLabel(service: Pick<CatalogService, "name">, v: Pick<CatalogVariant, "name" | "group">) {
  // "Fabric" or "SUV" describe the job; "By home size" only says how the menu is grouped, so leave it out.
  const group = v.group?.startsWith("By ") ? null : v.group;
  return [service.name, group, v.name].filter(Boolean).join(", ");
}

export function computeQuote(
  cart: CartLine[],
  catalog: CatalogService[],
  coupon: ApplicableCoupon | null = null,
): Quote {
  if (cart.length === 0) throw new QuoteError("Your cart is empty");
  const byId = new Map(catalog.map((s) => [s.id, s]));
  const lines: QuoteLine[] = [];
  let washers = 0;
  let priceMayChangeOnSite = false;

  for (const item of cart) {
    const service = byId.get(item.serviceId);
    const variant = service?.variants.find((v) => v.id === item.variantId);
    if (!service || !variant) throw new QuoteError("A service in your cart is no longer available");
    assertQty(item.qty, variant.maxQty, variant.name);
    lines.push({
      serviceId: service.id,
      kind: "variant",
      variantId: variant.id,
      addonId: null,
      name: variantLabel(service, variant),
      unitPrice: variant.price,
      qty: item.qty,
      amount: variant.price * item.qty,
      durationMinutes: variant.durationMinutes * item.qty,
    });
    for (const a of item.addons) {
      const addon = service.addons.find((x) => x.id === a.addonId);
      if (!addon) throw new QuoteError("An add-on in your cart is no longer available");
      assertQty(a.qty, addon.maxQty, addon.name);
      lines.push({
        serviceId: service.id,
        kind: "addon",
        variantId: null,
        addonId: addon.id,
        name: addon.name,
        unitPrice: addon.price,
        qty: a.qty,
        amount: addon.price * a.qty,
        durationMinutes: addon.durationMinutes * a.qty,
      });
    }
    washers = Math.max(washers, service.washers);
    priceMayChangeOnSite ||= service.priceMayChangeOnSite;
  }

  const subtotal = sum(lines.map((l) => l.amount));
  const visitCharge = subtotal >= PRICING.visitChargeWaivedFrom ? 0 : PRICING.visitCharge;
  const { discount, error: couponError } = couponDiscount(coupon, lines, subtotal);
  const tax = Math.round(((subtotal - discount + visitCharge) * PRICING.gstPercent) / 100);

  return {
    lines,
    subtotal,
    visitCharge,
    discount,
    couponCode: discount > 0 ? coupon!.code : null,
    couponError,
    tax,
    total: subtotal - discount + visitCharge + tax,
    durationMinutes: sum(lines.map((l) => l.durationMinutes)),
    washers,
    priceMayChangeOnSite,
  };
}

function couponDiscount(coupon: ApplicableCoupon | null, lines: QuoteLine[], subtotal: number) {
  if (!coupon) return { discount: 0, error: null };
  if (subtotal < coupon.minOrder) return { discount: 0, error: `Add items worth ${rupees(coupon.minOrder)} or more to use this code` };
  const base = coupon.serviceId === null ? subtotal : sum(lines.filter((l) => l.serviceId === coupon.serviceId).map((l) => l.amount));
  if (base === 0) return { discount: 0, error: "This code doesn't apply to the services in your cart" };
  let discount = coupon.type === "percent" ? Math.round((base * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount);
  return { discount: Math.min(discount, base), error: null };
}

/** Amount to collect online before the booking is confirmed, rounded up to the next rupee. */
export function amountDueNow(total: number, option: PaymentOption): number {
  switch (option) {
    case "full":
      return total;
    case "advance":
      return Math.min(total, Math.ceil((total * PAYMENT.advancePercent) / 100 / 100) * 100);
    case "after_service":
    case "cash":
      return 0;
  }
}

function assertQty(qty: number, max: number, name: string) {
  if (!Number.isInteger(qty) || qty < 1 || qty > max) throw new QuoteError(`Invalid quantity for ${name}`);
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
