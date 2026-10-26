import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";
import { getContent } from "@/content";

export const metadata: Metadata = { title: "Terms and conditions" };

export default function Page() {
  return <PolicyPage {...getContent().policies.terms} />;
}
