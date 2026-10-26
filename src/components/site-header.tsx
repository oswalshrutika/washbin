import Link from "next/link";
import { Suspense } from "react";
import { UserRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";

export function SiteHeader() {
  return (
    <header className="sticky print:hidden top-0 z-30 border-b-2 border-grout bg-soap/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="flex items-center gap-1 text-[0.98rem] font-semibold sm:gap-2" aria-label="Main">
          <Link href="/services" className="rounded-md px-2.5 py-2 hover:bg-grout">
            Services
          </Link>
          <Link href="/pricing" className="hidden rounded-md px-2.5 py-2 hover:bg-grout sm:block">
            Pricing
          </Link>
          <Link href="/contact" className="hidden rounded-md px-2.5 py-2 hover:bg-grout sm:block">
            Help
          </Link>
          <Suspense fallback={<span className="block h-10 w-24" />}>
            <AccountLink />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

async function AccountLink() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link href="/login" className="ml-1 rounded-[var(--radius-field)] border-2 border-ink/15 px-3.5 py-1.5 hover:border-ink/40">
        Sign in
      </Link>
    );
  }
  return (
    <Link href="/account/bookings" className="ml-1 flex items-center gap-1.5 rounded-md px-2.5 py-2 hover:bg-grout">
      <UserRound className="size-5" aria-hidden />
      <span>My bookings</span>
    </Link>
  );
}
