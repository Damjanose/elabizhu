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

/** Hidden admin sign-in path. Not linked anywhere in the public UI. */
export const ADMIN_LOGIN_PATH = "/studio"

/** Login URL that returns the user to the current internal route after sign-in. */
export const loginHrefWithReturn = (loc: { pathname: string; search: string; hash: string }): string => {
  if (loc.pathname === ADMIN_LOGIN_PATH) {
    return `${loc.pathname}${loc.search}`
  }
  const target = `${loc.pathname}${loc.search}${loc.hash}` || "/"
  return `${ADMIN_LOGIN_PATH}?redirect=${encodeURIComponent(target)}`
}
