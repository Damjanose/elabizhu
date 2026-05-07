import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { fetchNotifications } from "../../services/notifications"
import { useAuth } from "../../types/auth-context"
import { useNotificationStore } from "../../stores/notificationStore"

export const NotificationBell = () => {
  const { user } = useAuth()
  const liveEpoch = useNotificationStore((s) => s.liveEpoch)
  const { data } = useQuery({
    queryKey: ["notifications", liveEpoch],
    queryFn: fetchNotifications,
    enabled: !!user,
  })

  if (!user) return null

  const unread = data?.filter((n) => !n.readAt).length ?? 0

  return (
    <Link className="aurelia-cart-icon text-decoration-none" to="/notifications" aria-label="Notifications">
      <span className="material-symbols-outlined">notifications</span>
      {unread > 0 && (
        <span className="aurelia-cart-badge">{unread}</span>
      )}
    </Link>
  )
}
