import { describe, expect, it } from "vitest";
import { amountDueNow, computeQuote, QuoteError, type CatalogService } from "./pricing";

const catalog: CatalogService[] = [
  {
    id: 1,
    slug: "deep-home-cleaning",
    name: "Deep home cleaning",
    icon: "Home",
    washers: 2,
    priceMayChangeOnSite: false,
    variants: [{ id: 10, name: "2 BHK", group: "By home size", price: 3999_00, durationMinutes: 300, unitLabel: null, maxQty: 1 }],
    addons: [{ id: 100, name: "Extra bathroom", price: 499_00, durationMinutes: 45, maxQty: 4 }],
  },
  {
    id: 2,
    slug: "bathroom-cleaning",
    name: "Bathroom cleaning",
    icon: "Bath",
    washers: 1,
    priceMayChangeOnSite: true,
    variants: [{ id: 20, name: "Standard", group: null, price: 499_00, durationMinutes: 45, unitLabel: "bathroom", maxQty: 6 }],
    addons: [],
  },
];

describe("computeQuote", () => {
  it("adds services, add-ons and GST, and waives the visit charge on big orders", () => {
    const q = computeQuote([{ serviceId: 1, variantId: 10, qty: 1, addons: [{ addonId: 100, qty: 2 }] }], catalog);
    expect(q.subtotal).toBe(4997_00);
    expect(q.visitCharge).toBe(0);
    expect(q.tax).toBe(Math.round(4997_00 * 0.18));
    expect(q.total).toBe(4997_00 + Math.round(4997_00 * 0.18));
    expect(q.durationMinutes).toBe(300 + 90);
    expect(q.washers).toBe(2);
  });

  it("charges a visit fee below the threshold and taxes it", () => {
    const q = computeQuote([{ serviceId: 2, variantId: 20, qty: 1, addons: [] }], catalog);
    expect(q.visitCharge).toBe(99_00);
    expect(q.tax).toBe(Math.round((499_00 + 99_00) * 0.18));
    expect(q.priceMayChangeOnSite).toBe(true);
  });

  it("caps a percentage coupon and applies it before tax", () => {
    const coupon = { code: "WELCOME10", type: "percent" as const, value: 10, maxDiscount: 300_00, minOrder: 0, serviceId: null };
    const q = computeQuote([{ serviceId: 1, variantId: 10, qty: 1, addons: [] }], catalog, coupon);
    expect(q.discount).toBe(300_00);
    expect(q.tax).toBe(Math.round((3999_00 - 300_00) * 0.18));
    expect(q.couponCode).toBe("WELCOME10");
  });

  it("rejects a coupon under its minimum order without failing the quote", () => {
    const coupon = { code: "LAUNCH200", type: "flat" as const, value: 200_00, maxDiscount: null, minOrder: 1499_00, serviceId: null };
    const q = computeQuote([{ serviceId: 2, variantId: 20, qty: 1, addons: [] }], catalog, coupon);
    expect(q.discount).toBe(0);
    expect(q.couponCode).toBeNull();
    expect(q.couponError).toMatch(/1,499/);
  });

  it("limits a service-specific coupon to that service's lines", () => {
    const coupon = { code: "BATH50", type: "percent" as const, value: 50, maxDiscount: null, minOrder: 0, serviceId: 2 };
    const q = computeQuote(
      [
        { serviceId: 1, variantId: 10, qty: 1, addons: [] },
        { serviceId: 2, variantId: 20, qty: 2, addons: [] },
      ],
      catalog,
      coupon,
    );
    expect(q.discount).toBe(499_00);
  });

  it("rejects unknown variants and out-of-range quantities", () => {
    expect(() => computeQuote([{ serviceId: 1, variantId: 999, qty: 1, addons: [] }], catalog)).toThrow(QuoteError);
    expect(() => computeQuote([{ serviceId: 2, variantId: 20, qty: 7, addons: [] }], catalog)).toThrow(QuoteError);
    expect(() => computeQuote([], catalog)).toThrow(QuoteError);
  });
});

describe("amountDueNow", () => {
  it("rounds the advance up to the next rupee", () => {
    expect(amountDueNow(4718_82, "advance")).toBe(1416_00);
    expect(amountDueNow(4718_82, "full")).toBe(4718_82);
    expect(amountDueNow(4718_82, "after_service")).toBe(0);
  });
});
