import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/page-title";
import { ServiceIcon } from "@/components/service-icon";
import { getContent } from "@/content";
import { getServices } from "@/lib/catalog";
import { formatINR } from "@/lib/money";
import { formatDuration } from "@/lib/time";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const t = getContent().pricing;
  const services = (await getServices()).filter((s) => !s.quoteOnly);
  return (
    <>
      <PageTitle title={t.title} lead={t.lead} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ul className="mb-10 space-y-1 text-ink-soft">
          {t.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
          {services.map((s) => (
            <section key={s.id}>
              <h2 className="flex items-center gap-3 text-2xl font-bold">
                <ServiceIcon name={s.icon} className="size-7" />
                <Link href={`/services/${s.slug}`} className="hover:underline">
                  {s.name}
                </Link>
              </h2>
              <table className="mt-3 w-full">
                <tbody className="divide-y-2 divide-grout border-y-2 border-grout">
                  {s.variants.map((v) => (
                    <tr key={v.id}>
                      <td className="py-2 pr-3">{[v.group, v.name].filter(Boolean).join(", ")}</td>
                      <td className="py-2 pr-3 text-ink-soft">{formatDuration(v.durationMinutes)}</td>
                      <td className="py-2 text-right font-semibold whitespace-nowrap">
                        {formatINR(v.price)}
                        {v.unitLabel && <span className="font-normal text-ink-soft"> per {v.unitLabel}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
        <p className="mt-12 text-ink-soft">
          Need something not listed?{" "}
          <Link href="/services/custom-cleaning" className="btn-quiet">
            Ask for a quote
          </Link>
        </p>
      </div>
    </>
  );
}
