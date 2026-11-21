import { useEffect, useMemo, useRef, useState } from "react"
import { FiBell } from "react-icons/fi"
import { Link, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { fetchOrders } from "../../services/orders"
import { useQueryLoadState } from "../../hooks/useQueryLoadState"
import { queryKeys } from "../../lib/query-keys"
import { queryTiming } from "../../lib/query-client"
import { useI18n, type TFunction } from "../../i18n"

const orderRef = (id: string) => `#AUR-${id.slice(0, 4).toUpperCase()}`

const formatRelative = (t: TFunction, locale: string, iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return t("admin.alerts.justNow")
  if (minutes < 60) return t("admin.alerts.minutesAgo", { count: minutes })
  const hours = Math.round(minutes / 60)
  if (hours < 24) return t("admin.alerts.hoursAgo", { count: hours })
  const days = Math.round(hours / 24)
  if (days < 7) return t("admin.alerts.daysAgo", { count: days })
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" })
}

export const AdminOrderAlerts = () => {
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const locale = lang === "sq" ? "sq-AL" : "en-GB"
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const ordersQuery = useQuery({
    queryKey: queryKeys.orders(),
    queryFn: fetchOrders,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: queryTiming.sessionStaleTime,
  })
  const { data: orders = [], isError } = ordersQuery
  const { showSkeleton } = useQueryLoadState(ordersQuery)

  const pendingOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === "pending")
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders])

  const badgeCount = pendingOrders.length

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div className="aurelia-admin-order-alerts" ref={rootRef}>
      <button
        type="button"
        className="aurelia-admin-shell-icon-btn aurelia-admin-order-alerts-trigger"
        aria-label={badgeCount > 0 ? t("admin.alerts.triggerPending", { count: badgeCount }) : t("admin.alerts.newOrders")}
        aria-expanded={open}
        aria-haspopup="menu"
        title={t("admin.alerts.newOrders")}
        onClick={() => setOpen((v) => !v)}
      >
        <FiBell />
        {badgeCount > 0 && <span className="aurelia-admin-order-alerts-badge">{badgeCount > 99 ? "99+" : badgeCount}</span>}
      </button>

      {open && (
        <div className="aurelia-admin-order-alerts-panel" role="menu" aria-label={t("admin.alerts.newOrders")}>
          <div className="aurelia-admin-order-alerts-head">
            <span className="aurelia-admin-order-alerts-kicker">{t("admin.common.operations")}</span>
            <h2 className="aurelia-admin-order-alerts-title">{t("admin.alerts.newOrders")}</h2>
            <p className="aurelia-admin-order-alerts-sub">{t("admin.alerts.subtitle")}</p>
          </div>

          {showSkeleton ? (
            <div className="aurelia-admin-order-alerts-skeleton" aria-busy="true" aria-live="polite">
              {[0, 1, 2].map((index) => (
                <div key={index} className="aurelia-admin-alerts-skeleton-row aurelia-shimmer-block" />
              ))}
            </div>
          ) : isError ? (
            <p className="aurelia-admin-order-alerts-empty">{t("admin.alerts.loadError")}</p>
          ) : pendingOrders.length === 0 ? (
            <p className="aurelia-admin-order-alerts-empty">{t("admin.alerts.empty")}</p>
          ) : (
            <ul className="aurelia-admin-order-alerts-list">
              {pendingOrders.slice(0, 8).map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    role="menuitem"
                    className="aurelia-admin-order-alerts-row"
                    onClick={() => {
                      setOpen(false)
                      navigate(`/admin/orders/${order.id}`)
                    }}
                  >
                    <span className="aurelia-admin-order-alerts-row-id">{orderRef(order.id)}</span>
                    <span className="aurelia-admin-order-alerts-row-meta">
                      <span className="aurelia-admin-order-alerts-row-amount">{Number(order.total).toFixed(2)}</span>
                      <span className="aurelia-admin-order-alerts-row-time">{formatRelative(t, locale, order.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="aurelia-admin-order-alerts-foot">
            <Link to="/admin/orders" className="aurelia-admin-order-alerts-link" role="menuitem" onClick={() => setOpen(false)}>
              {t("admin.alerts.viewAll")}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
