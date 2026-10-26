import { ChevronDown } from "lucide-react";
import type { Faq } from "@/db/schema";

export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y-2 divide-grout border-y-2 border-grout">
      {faqs.map((f) => (
        <details key={f.q} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-semibold [&::-webkit-details-marker]:hidden">
            {f.q}
            <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <p className="max-w-[68ch] pb-4 text-ink-soft">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
