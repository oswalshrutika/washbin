import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, Clock, Info, UsersRound, X } from "lucide-react";
import { FaqList } from "@/components/faq-list";
import { ServiceIcon } from "@/components/service-icon";
import { getService, getServices } from "@/lib/catalog";
import { formatINR } from "@/lib/money";
import { formatDuration } from "@/lib/time";

export async function generateStaticParams() {
  return (await getServices()).filter((s) => !s.quoteOnly).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const service = await getService((await params).slug);
  if (!service) return {};
  return { title: `${service.name} in Pune`, description: `${service.tagline} ${service.description}`.slice(0, 160) };
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const service = await getService((await params).slug);
  if (!service) notFound();
  if (service.quoteOnly) redirect("/services/custom-cleaning");

  const shortest = Math.min(...service.variants.map((v) => v.durationMinutes));
  const bookHref = `/book?service=${service.slug}`;

  return (
    <article>
      <header className="border-b-2 border-grout bg-grout-deep/40">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Link href="/services" className="btn-quiet">
            All services
          </Link>
          <div className="mt-4 flex items-start gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-[var(--radius-tile)] bg-white">
              <ServiceIcon name={service.icon} className="size-9" />
            </span>
            <div>
              <h1 className="text-4xl font-extrabold sm:text-5xl">{service.name}</h1>
              <p className="mt-2 text-lg text-ink-soft">{service.tagline}</p>
            </div>
          </div>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
            <div className="flex items-center gap-2">
              <dt className="sr-only">Starting price</dt>
              <dd className="font-display text-2xl font-extrabold">From {formatINR(service.startingPrice!)}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-teal" aria-hidden />
              <dt className="sr-only">Duration</dt>
              <dd>From {formatDuration(shortest)}</dd>
            </div>
            <div className="flex items-center gap-2">
              <UsersRound className="size-5 text-teal" aria-hidden />
              <dt className="sr-only">Team size</dt>
              <dd>{service.washers === 1 ? "1 washer" : `${service.washers} washers`}</dd>
            </div>
          </dl>
          <Link href={bookHref} className="btn-primary mt-6">
            Book {service.name.toLowerCase()}
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="max-w-[65ch] text-lg">{service.description}</p>

          <h2 className="mt-10 text-2xl font-bold">Prices</h2>
          <table className="mt-3 w-full text-left">
            <thead className="sr-only">
              <tr>
                <th>Option</th>
                <th>Time</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-grout border-y-2 border-grout">
              {service.variants.map((v) => (
                <tr key={v.id}>
                  <td className="py-3 pr-3 font-semibold">{[v.group, v.name].filter(Boolean).join(", ")}</td>
                  <td className="py-3 pr-3 text-ink-soft">{formatDuration(v.durationMinutes)}</td>
                  <td className="py-3 text-right font-semibold whitespace-nowrap">
                    {formatINR(v.price)}
                    {v.unitLabel && <span className="font-normal text-ink-soft"> per {v.unitLabel}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {service.addons.length > 0 && (
            <>
              <h3 className="mt-6 text-lg font-bold">Add-ons</h3>
              <ul className="mt-2 space-y-1">
                {service.addons.map((a) => (
                  <li key={a.id} className="flex justify-between gap-4">
                    <span>{a.name}</span>
                    <span className="font-semibold">{formatINR(a.price)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-4 text-sm text-ink-soft">Prices are before GST. Your full total is shown before you pay.</p>
          {service.priceMayChangeOnSite && (
            <p className="mt-4 flex gap-2 rounded-[var(--radius-tile)] bg-marigold/15 p-3">
              <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
              The price may change on site if the work differs from what was booked. You&apos;ll see and approve any change before it&apos;s added.
            </p>
          )}

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <section>
              <h2 className="text-2xl font-bold">What&apos;s included</h2>
              <ul className="mt-3 space-y-2">
                {service.inclusions.map((x) => (
                  <li key={x} className="flex gap-2">
                    <Check className="mt-1 size-5 shrink-0 text-teal" aria-hidden />
                    {x}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="text-2xl font-bold">Not included</h2>
              <ul className="mt-3 space-y-2">
                {service.exclusions.map((x) => (
                  <li key={x} className="flex gap-2 text-ink-soft">
                    <X className="mt-1 size-5 shrink-0 text-brick" aria-hidden />
                    {x}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <aside className="space-y-8 lg:pt-1">
          <section className="panel p-5">
            <h2 className="text-xl font-bold">We bring</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
              {service.washbinProvides.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <h2 className="mt-6 text-xl font-bold">Please keep ready</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
              {service.customerProvides.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </section>
          <Link href={bookHref} className="btn-primary w-full">
            Book {service.name.toLowerCase()}
          </Link>
        </aside>
      </div>

      {service.faqs.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-16">
          <h2 className="mb-5 text-2xl font-bold">Questions about {service.name.toLowerCase()}</h2>
          <FaqList faqs={service.faqs} />
        </section>
      )}
    </article>
  );
}
