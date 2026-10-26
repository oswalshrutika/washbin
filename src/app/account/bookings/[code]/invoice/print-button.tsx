"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" className="btn-secondary" onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden /> Print or save as PDF
    </button>
  );
}
