import type { UrgencyBadge } from "@jewellery/types"
import { useI18n } from "../../i18n"

const LABEL_KEY: Partial<Record<UrgencyBadge, string>> = {
  new: "home.badge.new",
  low_stock: "home.badge.low_stock",
  sold_out: "home.badge.sold_out",
}

export const BadgePill = ({ badge }: { badge: UrgencyBadge }) => {
  const { t } = useI18n()
  const key = LABEL_KEY[badge]
  if (!key) return null
  return <span className={`eb-home-badge eb-home-badge--${badge}`}>{t(key)}</span>
}
