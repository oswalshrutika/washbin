import Link from "next/link";

export function TileMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="6" fill="#12324a" />
      <rect x="6" y="6" width="9" height="9" rx="1.5" fill="#d7eee6" />
      <rect x="17" y="6" width="9" height="9" rx="1.5" fill="#f0a830" />
      <rect x="6" y="17" width="9" height="9" rx="1.5" fill="#d7eee6" />
      <rect x="17" y="17" width="9" height="9" rx="1.5" fill="#d7eee6" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Washbin home">
      <TileMark />
      <span className="font-display text-[1.35rem] font-extrabold tracking-tight">washbin</span>
    </Link>
  );
}
