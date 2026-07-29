import { PackageCheck } from "lucide-react";
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 shrink-0 ${className}`}>
      <PackageCheck className="text-brand-green" size={30} strokeWidth={2.2} />
      <span className="text-xl font-extrabold tracking-tight whitespace-nowrap">
        <span className="text-brand-navy">BULK</span>{" "}
        <span className="text-brand-blue">SUPPLY</span>
      </span>
    </Link>
  );
}
