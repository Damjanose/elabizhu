import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { fetchNotifications } from "../../services/notifications"
import { queryKeys } from "../../lib/query-keys"
import { queryTiming } from "../../lib/query-client"
import { useAuth } from "../../types/auth-context"
import { useNotificationStore } from "../../stores/notificationStore"
import { useI18n } from "../../i18n"

export const NotificationBell = () => {
  const { t } = useI18n()
  const { user } = useAuth()
  const liveEpoch = useNotificationStore((s) => s.liveEpoch)
  const { data } = useQuery({
    queryKey: queryKeys.notifications(liveEpoch),
    queryFn: fetchNotifications,
    enabled: !!user,
    staleTime: queryTiming.sessionStaleTime,
  })

  if (!user) return null

  const unread = data?.filter((n) => !n.readAt).length ?? 0

  return (
    <Link className="aurelia-cart-icon text-decoration-none" to="/notifications" aria-label={t("account.notifications.bellAria")}>
      <span className="material-symbols-outlined">notifications</span>
      {unread > 0 && (
        <span className="aurelia-cart-badge">{unread}</span>
      )}
    </Link>
  )
}
