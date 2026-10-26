import Link from "next/link";
import type { CSSProperties } from "react";
import { ServiceIcon } from "@/components/service-icon";
import type { Service } from "@/lib/catalog";
import { formatINR } from "@/lib/money";

/** One tile of the wall. `accent` tiles are marigold; the rest sit on the grout colour. */
export function ServiceTile({ service, accent = false, index = 0 }: { service: Service; accent?: boolean; index?: number }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className={`tile-in group flex min-h-36 flex-col justify-between gap-3 rounded-[var(--radius-tile)] p-3.5 sm:p-4 ${
        accent ? "bg-marigold" : "bg-white hover:bg-grout"
      } outline-offset-4`}
      style={{ animationDelay: `${index * 55}ms` } as CSSProperties}
    >
      <ServiceIcon name={service.icon} className="size-7 sm:size-8" />
      <span>
        <span className="block font-display text-[1.05rem] leading-tight font-bold sm:text-lg">{service.name}</span>
        <span className="mt-0.5 block text-sm text-ink-soft group-hover:text-ink">
          {service.quoteOnly ? "Ask for a quote" : service.startingPrice !== null ? `From ${formatINR(service.startingPrice)}` : null}
        </span>
      </span>
    </Link>
  );
}
