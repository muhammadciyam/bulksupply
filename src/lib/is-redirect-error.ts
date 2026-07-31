// Next's redirect()/notFound() signal a navigation by throwing a special
// error with a "NEXT_REDIRECT"/"NEXT_NOT_FOUND" digest. Optimistic-update
// rollback handlers wrap server actions in try/catch, so they must detect
// and rethrow this rather than treating it as a failed mutation — otherwise
// an expired session would show "something went wrong" instead of actually
// redirecting to the login page.
export function isNextNavigationSignal(err: unknown): boolean {
  const digest = (err as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND"));
}
