import { PackageCheck } from "lucide-react";
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-1.5 sm:gap-2 shrink-0 ${className}`}>
      <PackageCheck className="text-brand-green w-6 h-6 sm:w-[30px] sm:h-[30px]" strokeWidth={2.2} />
      <span className="text-base sm:text-xl font-extrabold tracking-tight whitespace-nowrap">
        <span className="text-brand-navy">BULK</span>{" "}
        <span className="text-brand-blue">SUPPLY</span>
      </span>
    </Link>
  );
}
