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
