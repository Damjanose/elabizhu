import { useQuery } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Link, useParams } from "react-router-dom"
import type { OrderStatus } from "@jewellery/types"
import { OrderTimeline } from "../components/order/OrderTimeline"
import { EmptyState } from "../components/feedback/EmptyState"
import { fetchOrder } from "../services/orders"

const TAX_RATE = 0.2

const STATUS_DISPLAY: Record<
  OrderStatus,
  { label: string; tone: "neutral" | "primary" | "secondary" | "success" | "danger"; copy: string }
> = {
  pending: {
    label: "Pending",
    tone: "neutral",
    copy: "Your order is awaiting confirmation from the atelier.",
  },
  confirmed: {
    label: "Confirmed",
    tone: "primary",
    copy: "We have your order. Each piece is being prepared with care.",
  },
  shipped: {
    label: "In Transit",
    tone: "secondary",
    copy: "Your selection is on its way via insured white-glove delivery.",
  },
  delivered: {
    label: "Delivered",
    tone: "success",
    copy: "Your piece has arrived. We hope it brings you joy.",
  },
  cancelled: {
    label: "Cancelled",
    tone: "danger",
    copy: "This order has been cancelled. Please contact us if you have questions.",
  },
}

const PAYMENT_LABELS: Record<string, string> = {
  card: "Card (simulated)",
  cod: "Cash on Delivery",
  bank: "Bank Transfer",
}

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

export const OrderDetailPage = () => {
  const { orderId = "" } = useParams<{ orderId: string }>()
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: !!orderId,
    retry: false,
  })

  if (isLoading) {
    return (
      <section className="aurelia-detail-shell">
        <EmptyState
          variant="page"
          icon="hourglass_empty"
          kicker="Loading"
          title="Retrieving your order…"
          copy="One moment while we pull the latest details from the atelier."
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
            copy="The reference you used may be incorrect, or the order belongs to a different account."
            cta={{ to: "/orders", label: "Back to Orders" }}
            secondaryCta={{ to: "/products", label: "Browse Collections" }}
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
          secondaryCta={{ to: "/orders", label: "Back to Orders" }}
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
  // Recover an estimated tax line so the summary mirrors the cart/checkout breakdown.
  // If the persisted total includes tax (>= subtotal), surface the difference; else show 20% estimated.
  const estimatedTax =
    total > itemSubtotal ? total - itemSubtotal : itemSubtotal * TAX_RATE
  const itemCount = data.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <section className="aurelia-order-detail">
      <Link to="/orders" className="aurelia-order-detail-back">
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
                        {formatCurrency(item.unitPrice)} each · Qty {item.quantity}
                      </p>
                    </div>
                    <span className="aurelia-order-item-total">
                      {formatCurrency(Number(item.unitPrice) * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <dl className="aurelia-order-detail-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatCurrency(itemSubtotal)}</dd>
              </div>
              <div>
                <dt>Estimated Taxes</dt>
                <dd>{formatCurrency(estimatedTax)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd className="aurelia-order-detail-shipping">Complimentary</dd>
              </div>
              <div className="aurelia-order-detail-totals-final">
                <dt>Total Paid</dt>
                <dd>{formatCurrency(data.total)}</dd>
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
                copy="We’ll record updates here as your order progresses."
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

          <article className="aurelia-order-detail-card aurelia-order-detail-concierge">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">Concierge</h2>
              <span className="material-symbols-outlined aurelia-order-detail-card-icon" aria-hidden>
                support_agent
              </span>
            </header>
            <p className="aurelia-order-detail-concierge-copy">
              Our atelier is available for questions, alterations, or shipping enquiries about this
              order.
            </p>
            <a
              className="aurelia-order-detail-concierge-link"
              href={`mailto:concierge@aurelia.atelier?subject=${encodeURIComponent(
                `Enquiry about order ${orderRef(data.id)}`,
              )}`}
            >
              <span>Contact Concierge</span>
              <span className="material-symbols-outlined" aria-hidden>arrow_forward</span>
            </a>
          </article>
        </aside>
      </div>
    </section>
  )
}
