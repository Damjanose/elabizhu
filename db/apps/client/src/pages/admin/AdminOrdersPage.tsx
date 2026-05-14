import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { OrderStatus } from "@jewellery/types"
import { Link, useNavigate } from "react-router-dom"
import { formatDisplayMoney } from "../../lib/display-currency"
import { fetchOrders } from "../../services/orders"
import { useAdminDisplayCurrency } from "../../stores/adminDisplayCurrencyStore"

type FilterId = "all" | "active" | "delivered" | "cancelled"

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped"]
const FILTERS: Array<{ id: FilterId; label: string; matches: (status: OrderStatus) => boolean }> = [
  { id: "all", label: "All", matches: () => true },
  { id: "active", label: "Active", matches: (status) => ACTIVE_STATUSES.includes(status) },
  { id: "delivered", label: "Delivered", matches: (status) => status === "delivered" },
  { id: "cancelled", label: "Cancelled", matches: (status) => status === "cancelled" },
]

const isActiveOrder = (status: OrderStatus) =>
  status === "pending" || status === "confirmed" || status === "shipped"
const clientLabel = (userId: string) => `Client ${userId.slice(0, 6).toUpperCase()}`
const tierLabel = (id: string) => `Tier ${id.slice(0, 4).toUpperCase()}`
const pieceLabel = (id: string) => `Signature Piece ${id.slice(0, 4).toUpperCase()}`
const orderLabel = (id: string) => `#AUR-${id.slice(0, 4).toUpperCase()}`

export const AdminOrdersPage = () => {
  const navigate = useNavigate()
  const displayCurrency = useAdminDisplayCurrency()
  const { data, isLoading } = useQuery({ queryKey: ["orders"], queryFn: fetchOrders })
  const [filter, setFilter] = useState<FilterId>("active")

  const orders = data ?? []
  const counts = useMemo(() => {
    const result: Record<FilterId, number> = { all: 0, active: 0, delivered: 0, cancelled: 0 }
    for (const order of orders) {
      for (const filterDef of FILTERS) {
        if (filterDef.matches(order.status)) result[filterDef.id] += 1
      }
    }
    return result
  }, [orders])
  const visibleOrders = useMemo(() => {
    const matcher = FILTERS.find((f) => f.id === filter)?.matches ?? (() => true)
    return orders.filter((order) => matcher(order.status))
  }, [orders, filter])
  const activeOrdersCount = orders.filter((order) => isActiveOrder(order.status)).length

  if (isLoading) {
    return (
      <div className="aurelia-admin-page" aria-busy="true" aria-live="polite" aria-label="Loading orders">
        <div className="aurelia-admin-page-header">
          <div>
            <p className="aurelia-admin-kicker mb-2">Operations</p>
            <h1 className="aurelia-admin-title mb-0">Order flow</h1>
          </div>
        </div>
        <section className="aurelia-admin-orders-section">
          <div className="aurelia-orders-skeleton">
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className="aurelia-orders-skeleton-row" />
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="aurelia-admin-page">
      <div className="aurelia-admin-page-header">
        <div>
          <p className="aurelia-admin-kicker mb-2">Operations</p>
          <h1 className="aurelia-admin-title mb-0">Order flow</h1>
        </div>
      </div>
      <section className="aurelia-admin-orders-section">
        <div className="aurelia-admin-orders-filters" role="tablist" aria-label="Filter admin orders">
          {FILTERS.map((filterDef) => (
            <button
              key={filterDef.id}
              type="button"
              role="tab"
              aria-selected={filter === filterDef.id}
              className={`aurelia-admin-orders-filter-chip ${filter === filterDef.id ? "is-active" : ""}`}
              onClick={() => setFilter(filterDef.id)}
            >
              <span>{filterDef.label}</span>
              <span className="aurelia-admin-orders-filter-count">{counts[filterDef.id]}</span>
            </button>
          ))}
        </div>
        <div className="table-responsive aurelia-admin-table-wrap aurelia-admin-orders-table-wrap">
          <table className="table align-middle mb-0 aurelia-admin-table aurelia-admin-orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Piece</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((o) => (
              <tr
                key={o.id}
                className={`aurelia-admin-orders-row aurelia-admin-orders-row--clickable ${filter === "all" && o.status === "delivered" ? "is-delivered-in-all" : ""}`}
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/admin/orders/${o.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    navigate(`/admin/orders/${o.id}`)
                  }
                }}
                aria-label={`Open order ${orderLabel(o.id)}`}
              >
                <td className="aurelia-admin-orders-id">
                  <strong>{orderLabel(o.id)}</strong>
                  <span>{new Date(o.createdAt).toLocaleDateString("en-GB")}</span>
                </td>
                <td className="aurelia-admin-orders-customer">
                  <strong>{clientLabel(o.userId)}</strong>
                  <span>{tierLabel(o.id)}</span>
                </td>
                <td className="aurelia-admin-orders-piece">
                  <strong>{pieceLabel(o.id)}</strong>
                  <span>
                    Total{" "}
                    {formatDisplayMoney(Number(o.total), displayCurrency, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </td>
                <td>
                  <span className={`aurelia-admin-status-chip ${o.status === "delivered" ? "is-success" : o.status === "shipped" ? "is-info" : o.status === "confirmed" ? "is-warning" : o.status === "cancelled" ? "is-danger" : "is-muted"}`}>
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
          {orders.length > 0 && visibleOrders.length === 0 && (
            <div className="aurelia-admin-panel p-3 d-flex justify-content-between align-items-center flex-wrap gap-2 border-top-0">
              <p className="mb-0">No orders in this view.</p>
              <button type="button" className="aurelia-btn aurelia-btn-outline" onClick={() => setFilter("all")}>
                Show all
              </button>
            </div>
          )}
          <div className="aurelia-admin-table-foot aurelia-admin-orders-foot">
            <span>
              {filter === "all" && `Showing ${visibleOrders.length} of ${orders.length} orders`}
              {filter === "active" &&
                `Showing ${visibleOrders.length} active order${visibleOrders.length === 1 ? "" : "s"}`}
              {filter === "delivered" &&
                `Showing ${visibleOrders.length} delivered order${visibleOrders.length === 1 ? "" : "s"}`}
              {filter === "cancelled" &&
                `Showing ${visibleOrders.length} cancelled order${visibleOrders.length === 1 ? "" : "s"}`}
            </span>
            <div className="aurelia-admin-orders-pager" aria-hidden>
              <button type="button" className="aurelia-admin-orders-pager-btn" tabIndex={-1}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button type="button" className="aurelia-admin-orders-pager-btn" tabIndex={-1}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
