"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/account/bookings", label: "Bookings" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/coupons", label: "Coupons" },
  { href: "/account/notifications", label: "Notifications" },
  { href: "/account", label: "Profile" },
];

export function AccountNav() {
  const path = usePathname();
  return (
    <nav aria-label="Account" className="-mx-4 flex gap-1 overflow-x-auto px-4 print:hidden">
      {LINKS.map((l) => {
        const active = l.href === "/account" ? path === "/account" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 border-b-4 px-3 py-2 font-semibold ${active ? "border-marigold" : "border-transparent text-ink-soft hover:text-ink"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
