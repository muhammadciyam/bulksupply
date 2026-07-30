import Link from "next/link";

function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <rect width="200" height="200" rx="42" fill="#f2871e" />
      <text
        x="104"
        y="150"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="112"
        letterSpacing="-4"
        fill="#c96f16"
        opacity="0.45"
      >
        BS
      </text>
      <text
        x="100"
        y="146"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="112"
        letterSpacing="-4"
        fill="#ffffff"
      >
        BS
      </text>
    </svg>
  );
}

export function Logo({
  className = "",
  variant = "light",
  iconOnly = false,
}: {
  className?: string;
  variant?: "light" | "dark";
  iconOnly?: boolean;
}) {
  const primary = variant === "dark" ? "text-white" : "text-brand-navy";
  const accent = variant === "dark" ? "text-emerald-300" : "text-brand-blue";

  return (
    <Link href="/" className={`inline-flex items-center gap-2 shrink-0 ${className}`}>
      <LogoMark className="h-8 w-8 sm:h-9 sm:w-9 shrink-0" />
      {!iconOnly && (
        <span className="text-base sm:text-xl font-extrabold tracking-tight whitespace-nowrap leading-none">
          <span className={primary}>Bulk</span> <span className={accent}>Supply</span>
        </span>
      )}
    </Link>
  );
}
