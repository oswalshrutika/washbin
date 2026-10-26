"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { ServiceIcon } from "@/components/service-icon";
import { formatINR } from "@/lib/money";
import { formatDuration } from "@/lib/time";

type Item = {
  slug: string;
  name: string;
  icon: string;
  tagline: string;
  quoteOnly: boolean;
  startingPrice: number | null;
  shortestMinutes: number | null;
};

const PRICE_FILTERS = [
  { label: "Any price", max: Infinity },
  { label: "Under ₹1,000", max: 1000_00 },
  { label: "Under ₹2,000", max: 2000_00 },
  { label: "Under ₹5,000", max: 5000_00 },
];
const DURATION_FILTERS = [
  { label: "Any duration", max: Infinity },
  { label: "Up to 1 hour", max: 60 },
  { label: "Up to 2 hours", max: 120 },
  { label: "Up to 4 hours", max: 240 },
];

export function ServiceBrowser({ services }: { services: Item[] }) {
  const [query, setQuery] = useState("");
  const [price, setPrice] = useState(0);
  const [duration, setDuration] = useState(0);

  const q = query.trim().toLowerCase();
  const filtered = services.filter((s) => {
    if (q && !`${s.name} ${s.tagline}`.toLowerCase().includes(q)) return false;
    // Quote-only work has no fixed price or duration, so it only shows when those filters are off.
    if (price && (s.startingPrice === null || s.startingPrice > PRICE_FILTERS[price].max)) return false;
    if (duration && (s.shortestMinutes === null || s.shortestMinutes > DURATION_FILTERS[duration].max)) return false;
    return true;
  });

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="service-search" className="sr-only">
            Search services
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input
            id="service-search"
            type="search"
            className="field pl-10"
            placeholder="Search, e.g. sofa or tank"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="sr-only" htmlFor="price-filter">
          Price
        </label>
        <select id="price-filter" className="field sm:w-44" value={price} onChange={(e) => setPrice(Number(e.target.value))}>
          {PRICE_FILTERS.map((f, i) => (
            <option key={f.label} value={i}>
              {f.label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="duration-filter">
          Duration
        </label>
        <select id="duration-filter" className="field sm:w-44" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
          {DURATION_FILTERS.map((f, i) => (
            <option key={f.label} value={i}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-lg font-semibold">No services match those filters.</p>
          <p className="text-ink-soft">
            Clear a filter, or{" "}
            <Link href="/services/custom-cleaning" className="btn-quiet">
              ask us for a quote
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-[5px] rounded-[10px] bg-grout p-[5px] sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/services/${s.slug}`}
                className={`flex h-full gap-4 rounded-[var(--radius-tile)] p-5 ${s.quoteOnly ? "bg-marigold" : "bg-white hover:bg-soap"}`}
              >
                <ServiceIcon name={s.icon} className="mt-1 size-8 shrink-0" />
                <span>
                  <span className="block font-display text-xl font-bold">{s.name}</span>
                  <span className="mt-1 block text-ink-soft">{s.tagline}</span>
                  <span className="mt-3 block font-semibold">
                    {s.quoteOnly
                      ? "Ask for a quote"
                      : [s.startingPrice !== null && `From ${formatINR(s.startingPrice)}`, s.shortestMinutes && formatDuration(s.shortestMinutes)]
                          .filter(Boolean)
                          .join(", ")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
