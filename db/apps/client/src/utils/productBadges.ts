import type { Product, UrgencyBadge } from "@jewellery/types"
import { tNow, type TFunction } from "../i18n"

/** Translation key for a badge, or null when no badge should show. */
export const badgeKey = (b: UrgencyBadge): string | null => {
  switch (b) {
    case "new":
      return "catalog.badge.new"
    case "low_stock":
      return "catalog.badge.lowStock"
    case "sold_out":
      return "catalog.badge.soldOut"
    default:
      return null
  }
}

/** Translated badge label. Defaults to the current language when no translator is passed. */
export const badgeLabel = (b: UrgencyBadge, t: TFunction = tNow): string => {
  const key = badgeKey(b)
  return key ? t(key) : ""
}

/** Derives the badge to show on the card from stock + server urgency flag. */
export const deriveDisplayBadge = (p: Product): UrgencyBadge | null => {
  if (p.stockQuantity <= 0) return "sold_out"
  if (p.stockQuantity <= p.lowStockThreshold) return "low_stock"
  if (p.urgencyBadge === "new") return "new"
  return null
}
