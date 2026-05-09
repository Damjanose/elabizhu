import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { OrderStatus, OrderSummary } from "@jewellery/types"
import { Link } from "react-router-dom"
import { EmptyState } from "../components/feedback/EmptyState"
import { fetchOrders } from "../services/orders"

type FilterId = "all" | "active" | "delivered" | "cancelled"

const STATUS_DISPLAY: Record<OrderStatus, { label: string; tone: "neutral" | "primary" | "secondary" | "success" | "danger" }> = {
  pending: { label: "Pending", tone: "neutral" },
  confirmed: { label: "Confirmed", tone: "primary" },
  shipped: { label: "Shipped", tone: "secondary" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
}

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped"]

const FILTERS: Array<{ id: FilterId; label: string; matches: (status: OrderStatus) => boolean }> = [
  { id: "all", label: "All", matches: () => true },
  { id: "active", label: "Active", matches: (s) => ACTIVE_STATUSES.includes(s) },
  { id: "delivered", label: "Delivered", matches: (s) => s === "delivered" },
  { id: "cancelled", label: "Cancelled", matches: (s) => s === "cancelled" },
]

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))

const formatDate = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

const orderRef = (id: string) => `#AUR-${id.slice(0, 6).toUpperCase()}`

export const OrdersPage = () => {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  })
  const [filter, setFilter] = useState<FilterId>("all")

  const sorted = useMemo(
    () =>
      (data ?? []).slice().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [data],
  )

  const counts = useMemo(() => {
    const result: Record<FilterId, number> = { all: 0, active: 0, delivered: 0, cancelled: 0 }
    for (const o of sorted) {
      for (const f of FILTERS) {
        if (f.matches(o.status)) result[f.id] += 1
      }
    }
    return result
  }, [sorted])

  const visible = useMemo(() => {
    const matcher = FILTERS.find((f) => f.id === filter)?.matches ?? (() => true)
    return sorted.filter((o) => matcher(o.status))
  }, [sorted, filter])

  return (
    <section className="aurelia-orders">
      <header className="aurelia-orders-hero">
        <span className="aurelia-admin-kicker d-block mb-3">Personal Atelier</span>
        <h1 className="aurelia-orders-hero-title">Order History</h1>
        <p className="aurelia-orders-hero-copy">
          A complete record of your bespoke acquisitions and journeys with the atelier.
        </p>
      </header>

      <div className="aurelia-orders-toolbar" role="tablist" aria-label="Filter orders">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`aurelia-orders-chip ${filter === f.id ? "is-active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            <span>{f.label}</span>
            <span className="aurelia-orders-chip-count">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <OrdersSkeleton />
      ) : isError ? (
        <EmptyState
          variant="card"
          tone="danger"
          icon="error"
          kicker="Connection Issue"
          title="We couldn’t load your orders"
          copy="An unexpected error interrupted our request. Please try again."
          cta={{ label: isFetching ? "Retrying…" : "Try Again", onClick: () => void refetch() }}
          secondaryCta={{ to: "/products", label: "Browse Collections" }}
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          variant="card"
          icon="auto_stories"
          kicker="A Blank Page"
          title="No orders yet"
          copy="Begin your collection and your acquisitions will appear here."
          cta={{ to: "/products", label: "Explore Collections" }}
          secondaryCta={{ to: "/categories", label: "Shop by Category" }}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          variant="card"
          icon="filter_alt"
          title="Nothing in this view"
          copy="Try a different filter to see more of your history."
          cta={{ label: "Show All Orders", onClick: () => setFilter("all") }}
        />
      ) : (
        <OrdersTable orders={visible} />
      )}
    </section>
  )
}

const OrdersTable = ({ orders }: { orders: OrderSummary[] }) => (
  <div className="aurelia-admin-table-wrap aurelia-orders-table-wrap">
    <table className="table align-middle mb-0 aurelia-admin-table aurelia-orders-table">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Placed</th>
          <th>Status</th>
          <th>Total</th>
          <th className="text-end">Actions</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => {
          const display = STATUS_DISPLAY[order.status]
          const statusTone =
            display.tone === "success"
              ? "is-success"
              : display.tone === "secondary"
                ? "is-info"
                : display.tone === "primary"
                  ? "is-warning"
                  : display.tone === "danger"
                    ? "is-danger"
                    : "is-muted"

          return (
            <tr key={order.id}>
              <td className="fw-semibold">{orderRef(order.id)}</td>
              <td>{formatDate(order.createdAt)}</td>
              <td>
                <span className={`aurelia-admin-status-chip ${statusTone}`}>{display.label}</span>
              </td>
              <td>{formatCurrency(order.total)}</td>
              <td className="text-end">
                <Link to={`/orders/${order.id}`} className="aurelia-admin-icon-link" aria-label={`View order ${orderRef(order.id)}`}>
                  <span className="material-symbols-outlined" aria-hidden>
                    more_horiz
                  </span>
                </Link>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
    <div className="aurelia-admin-table-foot">Showing {orders.length} order{orders.length === 1 ? "" : "s"}</div>
  </div>
)

const OrdersSkeleton = () => (
  <div className="aurelia-orders-skeleton" aria-busy="true" aria-live="polite">
    {[0, 1, 2].map((i) => (
      <div key={i} className="aurelia-orders-skeleton-row" />
    ))}
  </div>
)
