import Link from "next/link";
import { BadgeCheck, IndianRupee, RotateCcw } from "lucide-react";
import { FaqList } from "@/components/faq-list";
import { PincodeChecker } from "@/components/pincode-checker";
import { ServiceTile } from "@/components/service-tile";
import { getContent } from "@/content";
import { getServices } from "@/lib/catalog";

const TRUST_ICONS = [BadgeCheck, IndianRupee, RotateCcw];

export default async function HomePage() {
  const t = getContent().home;
  const faqs = getContent().faqs;
  const services = await getServices();

  return (
    <>
      <section className="bg-grout-deep/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:py-16 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <div>
            <h1 className="text-[3.4rem] leading-[0.95] font-extrabold sm:text-7xl">{t.title}</h1>
            <p className="mt-5 max-w-[34ch] text-xl text-ink-soft">{t.lead}</p>
            <div className="mt-7 max-w-md">
              <p className="mb-2 font-semibold">{t.areaPrompt}</p>
              <PincodeChecker />
            </div>
          </div>
          <div>
            <h2 className="sr-only">{t.servicesTitle}</h2>
            {/* The grout gaps between tiles are the page's signature. */}
            <div className="grid auto-rows-fr grid-cols-2 gap-[5px] rounded-[10px] bg-grout-deep p-[5px] sm:grid-cols-4">
              {services.map((s, i) => (
                <ServiceTile key={s.id} service={s} index={i} accent={s.quoteOnly} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-3xl font-extrabold sm:text-4xl">{t.howTitle}</h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {t.how.map((step, i) => (
            <li key={step.title} className="border-t-4 border-ink pt-4">
              <span className="font-display text-4xl font-extrabold text-teal">{i + 1}</span>
              <h3 className="mt-2 text-xl font-bold">{step.title}</h3>
              <p className="mt-1 text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-ink text-soap">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{t.trustTitle}</h2>
          <div className="mt-8 grid gap-10 md:grid-cols-3">
            {t.trust.map((item, i) => {
              const Icon = TRUST_ICONS[i];
              return (
                <div key={item.title}>
                  <Icon className="size-8 text-marigold" aria-hidden />
                  <h3 className="mt-3 text-xl font-bold">{item.title}</h3>
                  <p className="mt-1 text-soap/75">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-6 md:grid-cols-2">
          {t.testimonials.map((r) => (
            <figure key={r.quote} className="border-l-4 border-marigold pl-5">
              <blockquote className="font-display text-2xl leading-snug font-semibold">&ldquo;{r.quote}&rdquo;</blockquote>
              <figcaption className="mt-3 text-ink-soft">
                {r.name}, {r.area}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16">
        <h2 className="mb-5 text-3xl font-extrabold sm:text-4xl">{t.faqTitle}</h2>
        <FaqList faqs={faqs} />
        <p className="mt-6 text-ink-soft">
          Something else on your mind?{" "}
          <Link href="/contact" className="btn-quiet">
            Talk to us
          </Link>
        </p>
      </section>
    </>
  );
}
