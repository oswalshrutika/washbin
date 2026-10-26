import Link from "next/link";
import { BRAND, SUPPORT } from "@/config/business";
import { TileMark } from "@/components/logo";

const LINKS = [
  { href: "/about", label: "About Washbin" },
  { href: "/services", label: "All services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact & help" },
  { href: "/terms", label: "Terms and conditions" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/cancellation-refund-policy", label: "Cancellation and refunds" },
  { href: "/damage-reservice-policy", label: "Damage and re-service" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 print:hidden bg-ink text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-[1.2fr_2fr]">
        <div>
          <div className="flex items-center gap-2 text-white">
            <TileMark />
            <span className="font-display text-xl font-extrabold">washbin</span>
          </div>
          <p className="mt-3 max-w-xs">
            Home and vehicle cleaning in Pune and Pimpri-Chinchwad. A {BRAND.parent} company.
          </p>
          <p className="mt-4">
            <a href={`tel:${SUPPORT.phone.replace(/\s/g, "")}`} className="font-semibold text-white hover:underline">
              {SUPPORT.phone}
            </a>
            <br />
            Support {SUPPORT.hours}
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:text-white hover:underline">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
