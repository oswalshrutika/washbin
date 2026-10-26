import { PageTitle } from "@/components/page-title";

type Section = { h: string; p: string[] };

export function PolicyPage({ title, sections }: { title: string; sections: Section[] }) {
  return (
    <>
      <PageTitle title={title} />
      <div className="prose-policy mx-auto max-w-6xl px-4 pt-4 pb-16">
        <p className="mt-4 inline-block rounded-[var(--radius-tile)] bg-marigold/20 px-3 py-1 text-sm font-semibold">
          Draft for review before launch
        </p>
        {sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p.map((para) => (
              <p key={para} className="mt-2">
                {para}
              </p>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
