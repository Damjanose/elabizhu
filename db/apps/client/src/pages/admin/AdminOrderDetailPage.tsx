import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Link, useParams } from "react-router-dom"
import type { OrderStatus } from "@jewellery/types"
import { OrderTimeline } from "../../components/order/OrderTimeline"
import { EmptyState } from "../../components/feedback/EmptyState"
import { formatDisplayMoney } from "../../lib/display-currency"
import { fetchOrder, updateOrderStatus } from "../../services/orders"
import { useAdminDisplayCurrency } from "../../stores/adminDisplayCurrencyStore"

const TAX_RATE = 0.2

const STATUS_DISPLAY: Record<
  OrderStatus,
  { label: string; tone: "neutral" | "primary" | "secondary" | "success" | "danger"; copy: string }
> = {
  pending: {
    label: "Pending",
    tone: "neutral",
    copy: "This order is awaiting confirmation from the atelier.",
  },
  confirmed: {
    label: "Confirmed",
    tone: "primary",
    copy: "The order is confirmed and is being prepared.",
  },
  shipped: {
    label: "In Transit",
    tone: "secondary",
    copy: "The order is on its way via insured delivery.",
  },
  delivered: {
    label: "Delivered",
    tone: "success",
    copy: "The order has been delivered.",
  },
  cancelled: {
    label: "Cancelled",
    tone: "danger",
    copy: "This order has been cancelled.",
  },
}

const PAYMENT_LABELS: Record<string, string> = {
  card: "Card (simulated)",
  cod: "Cash on Delivery",
  bank: "Bank Transfer",
}

const formatDate = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d)
}

const orderRef = (id: string) => `#AUR-${id.slice(0, 6).toUpperCase()}`

const formatPayment = (raw: string | null) => {
  if (!raw) return "Not recorded"
  return PAYMENT_LABELS[raw] ?? raw.replace(/_/g, " ")
}

const nextOptions = (current: OrderStatus): OrderStatus[] => {
  switch (current) {
    case "pending":
      return ["confirmed", "cancelled"]
    case "confirmed":
      return ["shipped", "cancelled"]
    case "shipped":
      return ["delivered"]
    default:
      return []
  }
}

const nextStepTone = (status: OrderStatus) => {
  if (status === "delivered") return "is-success"
  if (status === "shipped") return "is-info"
  if (status === "confirmed") return "is-warning"
  if (status === "cancelled") return "is-danger"
  return "is-muted"
}

const statusLabel = (status: OrderStatus) => status.charAt(0).toUpperCase() + status.slice(1)

export const AdminOrderDetailPage = () => {
  const displayCurrency = useAdminDisplayCurrency()
  const formatMoney = (value: string | number) =>
    formatDisplayMoney(Number(value), displayCurrency, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const queryClient = useQueryClient()
  const { orderId = "" } = useParams<{ orderId: string }>()
  const [confirmStatus, setConfirmStatus] = useState<OrderStatus | null>(null)
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: !!orderId,
    retry: false,
  })
  const patch = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(orderId, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["order", orderId] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
      ])
    },
  })

  if (isLoading) {
    return (
      <section className="aurelia-detail-shell">
        <EmptyState
          variant="page"
          icon="hourglass_empty"
          kicker="Loading"
          title="Retrieving order details…"
          copy="One moment while we pull the latest details."
        />
      </section>
    )
  }

  if (isError || !data) {
    const status = isAxiosError(error) ? error.response?.status : undefined
    if (status === 404) {
      return (
        <section className="aurelia-detail-shell">
          <EmptyState
            variant="page"
            icon="search_off"
            kicker="Order Not Found"
            title="We couldn’t locate this order"
            copy="The reference may be incorrect, or the order no longer exists."
            cta={{ to: "/admin/orders", label: "Back to Orders" }}
            secondaryCta={{ to: "/admin", label: "Back to Dashboard" }}
          />
        </section>
      )
    }
    return (
      <section className="aurelia-detail-shell">
        <EmptyState
          variant="page"
          icon="error"
          tone="danger"
          kicker="Something Went Wrong"
          title="Could not load this order"
          copy="An unexpected error interrupted our request. Please try again."
          cta={{ label: isFetching ? "Retrying…" : "Try Again", onClick: () => void refetch() }}
          secondaryCta={{ to: "/admin/orders", label: "Back to Orders" }}
        />
      </section>
    )
  }

  const display = STATUS_DISPLAY[data.status]
  const itemSubtotal = data.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0,
  )
  const total = Number(data.total)
  const estimatedTax = total > itemSubtotal ? total - itemSubtotal : itemSubtotal * TAX_RATE
  const itemCount = data.items.reduce((sum, item) => sum + item.quantity, 0)
  const transitions = nextOptions(data.status)

  return (
    <section className="aurelia-order-detail">
      <Link to="/admin/orders" className="aurelia-order-detail-back">
        <span className="material-symbols-outlined" aria-hidden>chevron_left</span>
        <span>Back to Orders</span>
      </Link>

      <header className="aurelia-order-detail-hero">
        <div className="aurelia-order-detail-hero-meta">
          <span className="aurelia-order-detail-kicker">Order Reference</span>
          <h1 className="aurelia-order-detail-ref">{orderRef(data.id)}</h1>
          <p className="aurelia-order-detail-placed">Placed on {formatDate(data.createdAt)}</p>
        </div>
        <div className="aurelia-order-detail-hero-status">
          <span
            className={`aurelia-orders-status aurelia-orders-status--${display.tone} aurelia-order-detail-status`}
          >
            <span className="aurelia-orders-status-dot" aria-hidden />
            {display.label}
          </span>
          <p className="aurelia-order-detail-status-copy">{display.copy}</p>
          {transitions.length > 0 && (
            <div className="d-flex flex-wrap gap-1 mt-2">
              {transitions.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`aurelia-btn aurelia-admin-next-step-btn ${nextStepTone(status)}`}
                  onClick={() => setConfirmStatus(status)}
                  disabled={patch.isPending}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="aurelia-order-detail-grid">
        <div className="aurelia-order-detail-main">
          <article className="aurelia-order-detail-card">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">Items</h2>
              <span className="aurelia-order-detail-card-meta">
                {itemCount} {itemCount === 1 ? "piece" : "pieces"}
              </span>
            </header>

            {data.items.length === 0 ? (
              <EmptyState
                variant="inline"
                icon="inventory_2"
                title="No items recorded"
                copy="This order has no items associated with it."
              />
            ) : (
              <ul className="aurelia-order-items">
                {data.items.map((item) => (
                  <li key={item.id} className="aurelia-order-item">
                    <div className="aurelia-order-item-thumb" aria-hidden>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" loading="lazy" />
                      ) : (
                        <span className="material-symbols-outlined">diamond</span>
                      )}
                    </div>
                    <div className="aurelia-order-item-meta">
                      <Link
                        to={`/products/${item.productId}`}
                        className="aurelia-order-item-name"
                      >
                        {item.productName}
                      </Link>
                      <p className="aurelia-order-item-sub">
                        {formatMoney(item.unitPrice)} each · Qty {item.quantity}
                      </p>
                    </div>
                    <span className="aurelia-order-item-total">
                      {formatMoney(Number(item.unitPrice) * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <dl className="aurelia-order-detail-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatMoney(itemSubtotal)}</dd>
              </div>
              <div>
                <dt>Estimated Taxes</dt>
                <dd>{formatMoney(estimatedTax)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd className="aurelia-order-detail-shipping">Complimentary</dd>
              </div>
              <div className="aurelia-order-detail-totals-final">
                <dt>Total Paid</dt>
                <dd>{formatMoney(data.total)}</dd>
              </div>
            </dl>
          </article>

          <article className="aurelia-order-detail-card">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">Tracking Timeline</h2>
            </header>
            {data.timeline.length === 0 ? (
              <EmptyState
                variant="inline"
                icon="timeline"
                title="No tracking events yet"
                copy="We’ll record updates here as the order progresses."
              />
            ) : (
              <OrderTimeline events={data.timeline} />
            )}
          </article>
        </div>

        <aside className="aurelia-order-detail-aside">
          <article className="aurelia-order-detail-card">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">Shipping</h2>
              <span className="material-symbols-outlined aurelia-order-detail-card-icon" aria-hidden>
                local_shipping
              </span>
            </header>
            {data.shippingAddress ? (
              <address className="aurelia-order-detail-address">{data.shippingAddress}</address>
            ) : (
              <p className="aurelia-order-detail-empty">No shipping address recorded.</p>
            )}
          </article>

          <article className="aurelia-order-detail-card">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">Payment</h2>
              <span className="material-symbols-outlined aurelia-order-detail-card-icon" aria-hidden>
                lock
              </span>
            </header>
            <p className="aurelia-order-detail-payment">{formatPayment(data.paymentMethod)}</p>
            <p className="aurelia-order-detail-payment-note">
              Securely captured at the time of order.
            </p>
          </article>
        </aside>
      </div>
      {confirmStatus && (
        <div className="aurelia-admin-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-detail-confirm-title">
          <div className="aurelia-admin-confirm-modal">
            <p className="aurelia-admin-kicker mb-2">Confirm status change</p>
            <h3 id="admin-detail-confirm-title" className="aurelia-admin-card-title mb-2">
              Move to {statusLabel(confirmStatus)}?
            </h3>
            <p className="aurelia-muted mb-3">
              This order will move from {statusLabel(data.status)} to {statusLabel(confirmStatus)}.
            </p>
            <div className="aurelia-admin-confirm-actions">
              <button type="button" className="aurelia-btn aurelia-btn-outline" onClick={() => setConfirmStatus(null)}>
                Back
              </button>
              <button
                type="button"
                className={`aurelia-btn aurelia-admin-next-step-btn ${nextStepTone(confirmStatus)}`}
                disabled={patch.isPending}
                onClick={() => {
                  void patch.mutateAsync(confirmStatus).then(() => setConfirmStatus(null))
                }}
              >
                {patch.isPending ? "Updating..." : `Confirm ${statusLabel(confirmStatus)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
