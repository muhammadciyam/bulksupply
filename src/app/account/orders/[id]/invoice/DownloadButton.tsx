"use client";

import { Printer } from "lucide-react";

export function DownloadButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white text-sm font-semibold px-4 py-2 rounded-md"
    >
      <Printer size={16} /> Download / Print
    </button>
  );
}
