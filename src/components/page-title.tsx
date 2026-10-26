export function PageTitle({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="border-b-2 border-grout bg-grout-deep/40">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>
        {lead && <p className="mt-3 max-w-[60ch] text-lg text-ink-soft">{lead}</p>}
      </div>
    </div>
  );
}
