import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/page-title";
import { getContent } from "@/content";
import { getServedLocalities } from "@/lib/catalog";

export const metadata: Metadata = { title: "About Washbin" };

export default async function AboutPage() {
  const t = getContent().about;
  const localities = await getServedLocalities();
  const byCity = Map.groupBy(localities, (l) => l.city);
  return (
    <>
      <PageTitle title={t.title} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="max-w-[65ch] space-y-4 text-lg">
          {t.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <h2 className="mt-12 text-2xl font-bold">Where we work</h2>
        <div className="mt-4 grid gap-8 sm:grid-cols-2">
          {[...byCity].map(([city, list]) => (
            <section key={city}>
              <h3 className="text-lg font-bold">{city === "PCMC" ? "Pimpri-Chinchwad" : city}</h3>
              <p className="mt-1 text-ink-soft">{list.map((l) => `${l.locality} (${l.code})`).join(", ")}</p>
            </section>
          ))}
        </div>
        <p className="mt-10">
          <Link href="/services" className="btn-primary">
            See our services
          </Link>
        </p>
      </div>
    </>
  );
}
