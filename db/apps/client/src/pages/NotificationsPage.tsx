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

const formatRelative = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} d ago`
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

export const NotificationsPage = () => {
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
    onError: (err) => toastFromError(err, "Could not mark notification as read"),
  })

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
      successToast("All notifications marked as read")
    },
    onError: (err) => toastFromError(err, "Could not mark all as read"),
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
          <span className="aurelia-admin-kicker d-block mb-3">Personal Atelier</span>
          <h1 className="aurelia-notifications-title">Notifications</h1>
          <p className="aurelia-notifications-copy">
            Updates on your orders, atelier announcements, and curated stories — all in one place.
          </p>
        </div>
        {sorted.length > 0 && (
          <button
            type="button"
            className="aurelia-notifications-mark"
            disabled={markAll.isPending || unreadCount === 0}
            onClick={() => void markAll.mutateAsync()}
          >
            {unreadCount === 0
              ? "All Caught Up"
              : markAll.isPending
                ? "Marking…"
                : `Mark All as Read (${unreadCount})`}
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
          kicker="Connection Issue"
          title="We couldn’t fetch your notifications"
          copy="Please refresh, or come back in a moment."
          cta={{ label: isFetching ? "Retrying…" : "Try Again", onClick: () => void refetch() }}
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          variant="card"
          icon="notifications_off"
          kicker="All Quiet"
          title="You’re all caught up"
          copy="When orders progress or your atelier has news, updates will appear here."
          cta={{ to: "/products", label: "Browse Collections" }}
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
  const isUnread = !notification.readAt
  return (
    <li className={`aurelia-notifications-row ${isUnread ? "is-unread" : ""}`}>
      <button
        type="button"
        className="aurelia-notifications-row-link"
        onClick={isUnread ? onMarkRead : undefined}
        aria-label={isUnread ? `Mark "${notification.title}" as read` : notification.title}
      >
        <span className="aurelia-notifications-row-marker" aria-hidden />
        <div className="aurelia-notifications-row-body">
          <div className="aurelia-notifications-row-head">
            <span className="aurelia-notifications-row-kicker">
              {notification.type.replace(/_/g, " ").toUpperCase()}
            </span>
            <time className="aurelia-notifications-row-time" dateTime={notification.createdAt}>
              {formatRelative(notification.createdAt)}
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
