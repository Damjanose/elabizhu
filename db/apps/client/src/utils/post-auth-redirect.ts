/**
 * Sanitize a redirect target so we never honour external URLs from query params.
 * Returns a path beginning with "/" or null when the input is unsafe.
 */
export const sanitizeRedirect = (raw: string | null | undefined): string | null => {
  if (!raw) return null
  if (!raw.startsWith("/")) return null
  if (raw.startsWith("//")) return null
  return raw
}

/** `/login` URL that returns the user to the current internal route after sign-in. */
export const loginHrefWithReturn = (loc: { pathname: string; search: string; hash: string }): string => {
  if (loc.pathname === "/login" || loc.pathname === "/register") {
    return `${loc.pathname}${loc.search}`
  }
  const target = `${loc.pathname}${loc.search}${loc.hash}` || "/"
  return `/login?redirect=${encodeURIComponent(target)}`
}
