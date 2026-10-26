"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { ServiceIcon } from "@/components/service-icon";
import { formatINR } from "@/lib/money";
import type { CartLine, CatalogService } from "@/lib/pricing";
import { formatDuration } from "@/lib/time";

export function StepServices({
  catalog,
  cart,
  setCart,
  initialSlug,
}: {
  catalog: CatalogService[];
  cart: CartLine[];
  setCart: (c: CartLine[]) => void;
  initialSlug: string | null;
}) {
  const [open, setOpen] = useState<number | null>(() => catalog.find((s) => s.slug === initialSlug)?.id ?? null);

  return (
    <div>
      <h2 className="text-2xl font-bold">What should we clean?</h2>
      <p className="mt-1 text-ink-soft">Add as many services as you like. They&apos;re all done in the same visit.</p>

      {cart.length > 0 && <CartList catalog={catalog} cart={cart} setCart={setCart} />}

      <ul className="mt-6 space-y-[5px] rounded-[10px] bg-grout p-[5px]">
        {catalog.map((s) => (
          <li key={s.id} className="rounded-[var(--radius-tile)] bg-white">
            <button
              type="button"
              className="flex w-full items-center gap-3 p-4 text-left"
              aria-expanded={open === s.id}
              onClick={() => setOpen(open === s.id ? null : s.id)}
            >
              <ServiceIcon name={s.icon} className="size-7 shrink-0" />
              <span className="flex-1 font-display text-lg font-bold">{s.name}</span>
              <span className="text-sm text-ink-soft">From {formatINR(Math.min(...s.variants.map((v) => v.price)))}</span>
            </button>
            {open === s.id && (
              <ServiceEditor
                service={s}
                onAdd={(line) => {
                  setCart([...cart, line]);
                  setOpen(null);
                }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CartList({ catalog, cart, setCart }: { catalog: CatalogService[]; cart: CartLine[]; setCart: (c: CartLine[]) => void }) {
  return (
    <ul className="panel mt-5 divide-y-2 divide-grout">
      {cart.map((line, i) => {
        const service = catalog.find((s) => s.id === line.serviceId);
        const variant = service?.variants.find((v) => v.id === line.variantId);
        if (!service || !variant) return null;
        const addonNames = line.addons.map((a) => {
          const addon = service.addons.find((x) => x.id === a.addonId);
          return addon ? (a.qty > 1 ? `${addon.name} × ${a.qty}` : addon.name) : null;
        });
        return (
          <li key={i} className="flex items-start gap-3 p-4">
            <ServiceIcon name={service.icon} className="mt-0.5 size-6 shrink-0 text-teal" />
            <div className="flex-1">
              <p className="font-semibold">
                {service.name}, {[variant.group, variant.name].filter(Boolean).join(" ")}
                {line.qty > 1 && ` × ${line.qty}`}
              </p>
              {addonNames.some(Boolean) && <p className="text-sm text-ink-soft">With {addonNames.filter(Boolean).join(", ")}</p>}
            </div>
            <button
              type="button"
              className="rounded-md p-1.5 text-ink-soft hover:bg-grout hover:text-brick"
              aria-label={`Remove ${service.name}`}
              onClick={() => setCart(cart.filter((_, j) => j !== i))}
            >
              <Trash2 className="size-5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ServiceEditor({ service, onAdd }: { service: CatalogService; onAdd: (line: CartLine) => void }) {
  const [variantId, setVariantId] = useState(service.variants[0].id);
  const [qty, setQty] = useState(1);
  const [addons, setAddons] = useState<Record<number, number>>({});
  const variant = service.variants.find((v) => v.id === variantId)!;
  const groups = Map.groupBy(service.variants, (v) => v.group ?? "");

  const lineTotal =
    variant.price * qty + service.addons.reduce((sum, a) => sum + a.price * (addons[a.id] ?? 0), 0);

  return (
    <div className="border-t-2 border-grout px-4 pt-3 pb-4">
      {[...groups].map(([group, variants]) => (
        <fieldset key={group} className="mt-2">
          {group && <legend className="mb-1.5 font-semibold">{group}</legend>}
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <label
                key={v.id}
                className={`cursor-pointer rounded-[var(--radius-field)] border-2 px-3.5 py-2 has-focus-visible:outline-3 has-focus-visible:outline-teal ${
                  v.id === variantId ? "border-teal bg-teal/10" : "border-ink/15 hover:border-ink/40"
                }`}
              >
                <input
                  type="radio"
                  name={`variant-${service.id}`}
                  className="sr-only"
                  checked={v.id === variantId}
                  onChange={() => {
                    setVariantId(v.id);
                    setQty(1);
                  }}
                />
                <span className="block font-semibold">{v.name}</span>
                <span className="block text-sm text-ink-soft">
                  {formatINR(v.price)}
                  {v.unitLabel && ` per ${v.unitLabel}`}, {formatDuration(v.durationMinutes)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      {variant.maxQty > 1 && (
        <Stepper label={`Number of ${variant.unitLabel ?? "units"}s`} value={qty} min={1} max={variant.maxQty} onChange={setQty} />
      )}

      {service.addons.length > 0 && (
        <fieldset className="mt-4">
          <legend className="mb-1 font-semibold">Add-ons</legend>
          <ul className="space-y-1">
            {service.addons.map((a) => (
              <li key={a.id}>
                <Stepper
                  label={`${a.name}, ${formatINR(a.price)}`}
                  value={addons[a.id] ?? 0}
                  min={0}
                  max={a.maxQty}
                  onChange={(n) => setAddons({ ...addons, [a.id]: n })}
                />
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <button
        type="button"
        className="btn-primary mt-5 w-full sm:w-auto"
        onClick={() =>
          onAdd({
            serviceId: service.id,
            variantId,
            qty,
            addons: Object.entries(addons)
              .filter(([, n]) => n > 0)
              .map(([id, n]) => ({ addonId: Number(id), qty: n })),
          })
        }
      >
        Add to visit, {formatINR(lineTotal)}
      </button>
    </div>
  );
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="flex items-center gap-1">
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full border-2 border-ink/15 disabled:opacity-30"
          aria-label={`Fewer: ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          <Minus className="size-4" />
        </button>
        <span className="w-8 text-center font-semibold" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full border-2 border-ink/15 disabled:opacity-30"
          aria-label={`More: ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          <Plus className="size-4" />
        </button>
      </span>
    </div>
  );
}
