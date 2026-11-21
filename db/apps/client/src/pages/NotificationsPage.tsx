import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { NotificationDto } from "@jewellery/types"
import { EmptyState } from "../components/feedback/EmptyState"
import { useQueryLoadState } from "../hooks/useQueryLoadState"
import { queryKeys } from "../lib/query-keys"
import { queryTiming } from "../lib/query-client"
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notifications"
import { successToast, toastFromError } from "../utils/toast"
import { useI18n, type TFunction, type Lang } from "../i18n"

const formatRelative = (iso: string, t: TFunction, lang: Lang) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return t("account.notifications.justNow")
  if (minutes < 60) return t("account.notifications.minutesAgo", { count: minutes })
  const hours = Math.round(minutes / 60)
  if (hours < 24) return t("account.notifications.hoursAgo", { count: hours })
  const days = Math.round(hours / 24)
  if (days < 7) return t("account.notifications.daysAgo", { count: days })
  return date.toLocaleDateString(lang === "sq" ? "sq-AL" : undefined, { day: "numeric", month: "short", year: "numeric" })
}

export const NotificationsPage = () => {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: fetchNotifications,
    staleTime: queryTiming.sessionStaleTime,
  })
  const { data, isError, refetch, isFetching } = notificationsQuery
  const { showSkeleton } = useQueryLoadState(notificationsQuery)

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.notifications() }),
    onError: (err) => toastFromError(err, t("account.notifications.markOneError")),
  })

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
      successToast(t("account.notifications.markAllSuccess"))
    },
    onError: (err) => toastFromError(err, t("account.notifications.markAllError")),
  })

  const sorted = useMemo(
    () =>
      (data ?? [])
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [data],
  )

  const unreadCount = useMemo(() => sorted.filter((n) => !n.readAt).length, [sorted])

  return (
    <section className="aurelia-notifications">
      <header className="aurelia-notifications-hero">
        <div>
          <span className="aurelia-admin-kicker d-block mb-3">{t("account.common.personalAtelier")}</span>
          <h1 className="aurelia-notifications-title">{t("account.notifications.title")}</h1>
          <p className="aurelia-notifications-copy">{t("account.notifications.copy")}</p>
        </div>
        {sorted.length > 0 && (
          <button
            type="button"
            className="aurelia-notifications-mark"
            disabled={markAll.isPending || unreadCount === 0}
            onClick={() => void markAll.mutateAsync()}
          >
            {unreadCount === 0
              ? t("account.notifications.allCaughtUp")
              : markAll.isPending
                ? t("account.notifications.marking")
                : t("account.notifications.markAll", { count: unreadCount })}
          </button>
        )}
      </header>

      {showSkeleton ? (
        <NotificationsSkeleton />
      ) : isError ? (
        <EmptyState
          variant="card"
          tone="danger"
          icon="error"
          kicker={t("account.common.connectionIssue")}
          title={t("account.notifications.errorTitle")}
          copy={t("account.notifications.errorCopy")}
          cta={{ label: isFetching ? t("account.common.retrying") : t("account.common.tryAgain"), onClick: () => void refetch() }}
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          variant="card"
          icon="notifications_off"
          kicker={t("account.notifications.emptyKicker")}
          title={t("account.notifications.emptyTitle")}
          copy={t("account.notifications.emptyCopy")}
          cta={{ to: "/products", label: t("account.common.browseCollections") }}
        />
      ) : (
        <ul className="aurelia-notifications-list">
          {sorted.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onMarkRead={() => void markOne.mutateAsync(notification.id)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

const NotificationRow = ({
  notification,
  onMarkRead,
}: {
  notification: NotificationDto
  onMarkRead: () => void
}) => {
  const { t, lang } = useI18n()
  const isUnread = !notification.readAt
  return (
    <li className={`aurelia-notifications-row ${isUnread ? "is-unread" : ""}`}>
      <button
        type="button"
        className="aurelia-notifications-row-link"
        onClick={isUnread ? onMarkRead : undefined}
        aria-label={isUnread ? t("account.notifications.markOneAria", { title: notification.title }) : notification.title}
      >
        <span className="aurelia-notifications-row-marker" aria-hidden />
        <div className="aurelia-notifications-row-body">
          <div className="aurelia-notifications-row-head">
            <span className="aurelia-notifications-row-kicker">
              {notification.type.replace(/_/g, " ").toUpperCase()}
            </span>
            <time className="aurelia-notifications-row-time" dateTime={notification.createdAt}>
              {formatRelative(notification.createdAt, t, lang)}
            </time>
          </div>
          <p className="aurelia-notifications-row-title">{notification.title}</p>
          {notification.body && (
            <p className="aurelia-notifications-row-copy">{notification.body}</p>
          )}
        </div>
      </button>
    </li>
  )
}

const NotificationsSkeleton = () => (
  <div className="aurelia-notifications-skeleton" aria-busy="true" aria-live="polite">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="aurelia-notifications-skeleton-row" />
    ))}
  </div>
)
