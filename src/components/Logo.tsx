import Link from "next/link";

export function Logo({
  className = "",
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const primary = variant === "dark" ? "text-white" : "text-brand-navy";
  const accent = variant === "dark" ? "text-emerald-300" : "text-brand-blue";
  const underline = variant === "dark" ? "bg-brand-green" : "bg-brand-blue";

  return (
    <Link href="/" className={`inline-flex flex-col shrink-0 ${className}`}>
      <span className="text-lg sm:text-2xl font-extrabold tracking-tighter whitespace-nowrap leading-none">
        <span className={primary}>BULK</span>
        <span className={accent}>SUPPLY</span>
      </span>
      <span className={`h-[3px] mt-1 rounded-full ${underline}`} />
    </Link>
  );
}
