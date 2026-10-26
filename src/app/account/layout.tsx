import { Suspense } from "react";
import { AccountNav } from "./account-nav";

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Suspense fallback={<div className="h-11" />}>
        <AccountNav />
      </Suspense>
      <div className="mt-8">{children}</div>
    </div>
  );
}
