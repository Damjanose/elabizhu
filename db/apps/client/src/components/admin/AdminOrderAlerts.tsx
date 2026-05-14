import { useEffect, useMemo, useRef, useState } from "react"
import { FiBell } from "react-icons/fi"
import { Link, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { fetchOrders } from "../../services/orders"

const orderRef = (id: string) => `#AUR-${id.slice(0, 4).toUpperCase()}`

const formatRelative = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

export const AdminOrderAlerts = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

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
        aria-label={badgeCount > 0 ? `New orders: ${badgeCount} pending` : "New orders"}
        aria-expanded={open}
        aria-haspopup="menu"
        title="New orders"
        onClick={() => setOpen((v) => !v)}
      >
        <FiBell />
        {badgeCount > 0 && <span className="aurelia-admin-order-alerts-badge">{badgeCount > 99 ? "99+" : badgeCount}</span>}
      </button>

      {open && (
        <div className="aurelia-admin-order-alerts-panel" role="menu" aria-label="New orders">
          <div className="aurelia-admin-order-alerts-head">
            <span className="aurelia-admin-order-alerts-kicker">Operations</span>
            <h2 className="aurelia-admin-order-alerts-title">New orders</h2>
            <p className="aurelia-admin-order-alerts-sub">Pending confirmation — same queue as your orders board.</p>
          </div>

          {isLoading ? (
            <div className="aurelia-admin-order-alerts-skeleton" aria-busy="true" aria-live="polite">
              {[0, 1, 2].map((index) => (
                <div key={index} className="aurelia-admin-alerts-skeleton-row aurelia-shimmer-block" />
              ))}
            </div>
          ) : isError ? (
            <p className="aurelia-admin-order-alerts-empty">Could not load orders.</p>
          ) : pendingOrders.length === 0 ? (
            <p className="aurelia-admin-order-alerts-empty">No pending orders. You’re caught up.</p>
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
                      <span className="aurelia-admin-order-alerts-row-time">{formatRelative(order.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="aurelia-admin-order-alerts-foot">
            <Link to="/admin/orders" className="aurelia-admin-order-alerts-link" role="menuitem" onClick={() => setOpen(false)}>
              View all orders
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
