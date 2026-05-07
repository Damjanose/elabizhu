import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import type {
  NotificationDto,
  OrderDetail,
  OrderStatus,
  OrderSummary,
  Product,
} from "@jewellery/types"
import { Link } from "react-router-dom"
import { useAuth } from "../types/auth-context"
import { fetchNotifications } from "../services/notifications"
import { fetchOrder, fetchOrders } from "../services/orders"
import { fetchProduct } from "../services/products"

const STATUS_DISPLAY: Record<OrderStatus, { label: string; description: string }> = {
  pending: { label: "Pending", description: "Order received and verified" },
  confirmed: { label: "Confirmed", description: "Final quality inspection passed" },
  shipped: { label: "Shipped", description: "Package in transit" },
  delivered: { label: "Delivered", description: "Package arrived at your door" },
  cancelled: { label: "Cancelled", description: "Order cancelled" },
}

const formatCurrency = (value: string) => {
  const n = Number(value)
  if (Number.isNaN(n)) return value
  return n.toLocaleString(undefined, { style: "currency", currency: "EUR" })
}

const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, opts)
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${formatDate(iso)}, ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
}

const pickActiveOrder = (orders: OrderSummary[] | undefined) => {
  if (!orders || orders.length === 0) return undefined
  const activeStatuses: OrderStatus[] = ["pending", "confirmed", "shipped"]
  const sorted = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  return sorted.find((o) => activeStatuses.includes(o.status)) ?? sorted[0]
}

export const AccountPage = () => {
  const { user } = useAuth()

  const ordersQuery = useQuery({
    queryKey: ["account", "orders"],
    queryFn: fetchOrders,
  })
  const notificationsQuery = useQuery({
    queryKey: ["account", "notifications"],
    queryFn: fetchNotifications,
  })

  const activeOrder = useMemo(() => pickActiveOrder(ordersQuery.data), [ordersQuery.data])

  const orderQuery = useQuery({
    queryKey: ["account", "order", activeOrder?.id],
    queryFn: () => (activeOrder ? fetchOrder(activeOrder.id) : Promise.reject()),
    enabled: !!activeOrder,
  })

  const featuredItem = orderQuery.data?.items?.[0]
  const productQuery = useQuery({
    queryKey: ["account", "product", featuredItem?.productId],
    queryFn: () => (featuredItem ? fetchProduct(featuredItem.productId) : Promise.reject()),
    enabled: !!featuredItem,
  })

  const displayName = user?.fullName?.trim() || user?.email || "Friend"
  const firstName = displayName.split(" ")[0]

  const unreadNotifications = useMemo(
    () => (notificationsQuery.data ?? []).filter((n) => !n.readAt),
    [notificationsQuery.data],
  )

  return (
    <section className="aurelia-account">
      <header className="aurelia-account-hero">
        <span className="aurelia-admin-kicker d-block mb-3">Personal Atelier</span>
        <h1 className="aurelia-account-hero-title">Welcome back, {firstName}</h1>
        <p className="aurelia-account-hero-copy">
          Manage your bespoke orders, profile settings, and curated preferences from your private dashboard.
        </p>
      </header>

      <div className="aurelia-bento">
        <ProfileCard
          name={user?.fullName?.trim() || displayName}
          email={user?.email ?? ""}
          tier={user && user.permissions.includes("admin") ? "Atelier Director" : "Aurelia Circle"}
        />

        <ActiveOrderCard
          order={activeOrder}
          orderDetail={orderQuery.data}
          loading={ordersQuery.isLoading || (!!activeOrder && orderQuery.isLoading)}
        />

        <NotificationsCard
          loading={notificationsQuery.isLoading}
          unreadCount={unreadNotifications.length}
          notifications={(notificationsQuery.data ?? []).slice(0, 2)}
        />
      </div>

      {orderQuery.data && (
        <div className="aurelia-account-detail">
          <TimelineCard order={orderQuery.data} />
          <div className="aurelia-account-detail-stack">
            {featuredItem && (
              <ItemDetailCard
                productName={featuredItem.productName}
                unitPrice={featuredItem.unitPrice}
                product={productQuery.data}
              />
            )}
            <DeliveryAlertCard total={orderQuery.data.total} />
          </div>
        </div>
      )}
    </section>
  )
}

const ProfileCard = ({
  name,
  email,
  tier,
}: {
  name: string
  email: string
  tier: string
}) => (
  <article className="aurelia-bento-card aurelia-bento-card--profile">
    <div className="aurelia-bento-card-head">
      <span className="material-symbols-outlined aurelia-bento-icon">account_circle</span>
      <Link to="/account" className="aurelia-bento-action">EDIT</Link>
    </div>
    <div className="aurelia-bento-card-body">
      <h3 className="aurelia-bento-headline">{name}</h3>
      <p className="aurelia-bento-meta">{email}</p>
    </div>
    <div className="aurelia-bento-card-foot">
      <span className="aurelia-tier-pill">{tier.toUpperCase()}</span>
    </div>
  </article>
)

const ActiveOrderCard = ({
  order,
  orderDetail,
  loading,
}: {
  order: OrderSummary | undefined
  orderDetail: OrderDetail | undefined
  loading: boolean
}) => {
  if (loading) {
    return <article className="aurelia-bento-card aurelia-bento-card--order is-loading" aria-busy="true" />
  }

  if (!order) {
    return (
      <article className="aurelia-bento-card aurelia-bento-card--order">
        <div className="aurelia-bento-card-head">
          <span className="material-symbols-outlined aurelia-bento-icon aurelia-bento-icon--inverse">
            auto_stories
          </span>
          <span className="aurelia-bento-action aurelia-bento-action--inverse">NEW HERE</span>
        </div>
        <div className="aurelia-bento-card-body">
          <h3 className="aurelia-bento-headline aurelia-bento-headline--inverse">Begin your collection</h3>
          <p className="aurelia-bento-meta aurelia-bento-meta--inverse">
            You haven't placed an order yet. Discover our latest curations.
          </p>
        </div>
        <div className="aurelia-bento-card-foot">
          <Link to="/products" className="aurelia-bento-button">
            EXPLORE COLLECTIONS
          </Link>
        </div>
      </article>
    )
  }

  const itemName = orderDetail?.items?.[0]?.productName ?? "Curated piece"
  const orderId = `#AUR-${order.id.slice(0, 6).toUpperCase()}`
  const eta = formatDate(order.updatedAt)
  const isActive = order.status !== "delivered" && order.status !== "cancelled"

  return (
    <article className="aurelia-bento-card aurelia-bento-card--order">
      <div className="aurelia-bento-card-head">
        <span className="material-symbols-outlined aurelia-bento-icon aurelia-bento-icon--inverse">
          auto_stories
        </span>
        <span className="aurelia-bento-action aurelia-bento-action--inverse">
          {isActive ? "ACTIVE ORDER" : "RECENT ORDER"}
        </span>
      </div>
      <div className="aurelia-bento-card-body">
        <h3 className="aurelia-bento-headline aurelia-bento-headline--inverse">Order {orderId}</h3>
        <p className="aurelia-bento-meta aurelia-bento-meta--inverse">{itemName}</p>
        <p className="aurelia-bento-meta aurelia-bento-meta--inverse aurelia-bento-meta--spaced">
          {isActive ? `Estimated Delivery: ${eta}` : `Completed: ${eta}`}
        </p>
      </div>
      <div className="aurelia-bento-card-foot">
        <Link to="/orders" className="aurelia-bento-button">
          VIEW FULL HISTORY
        </Link>
      </div>
    </article>
  )
}

const NotificationsCard = ({
  notifications,
  unreadCount,
  loading,
}: {
  notifications: NotificationDto[]
  unreadCount: number
  loading: boolean
}) => {
  if (loading) {
    return <article className="aurelia-bento-card aurelia-bento-card--notifications is-loading" aria-busy="true" />
  }

  return (
    <article className="aurelia-bento-card aurelia-bento-card--notifications">
      <div className="aurelia-bento-card-head">
        <span className="aurelia-bento-icon-wrap">
          <span className="material-symbols-outlined aurelia-bento-icon">notifications</span>
          {unreadCount > 0 && <span aria-hidden className="aurelia-bento-icon-dot" />}
        </span>
        <span className="aurelia-bento-action">
          {unreadCount > 0 ? `${unreadCount} NEW` : "ALL READ"}
        </span>
      </div>

      <div className="aurelia-bento-notifications">
        {notifications.length === 0 ? (
          <p className="aurelia-bento-meta">You're all caught up.</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="aurelia-bento-notification">
              <span className="aurelia-bento-notification-kicker">{n.type.toUpperCase()}</span>
              <p className="aurelia-bento-notification-title">{n.title}</p>
              {n.body && <p className="aurelia-bento-notification-body">{n.body}</p>}
            </div>
          ))
        )}
      </div>
    </article>
  )
}

const TimelineCard = ({ order }: { order: OrderDetail }) => {
  const events = useMemo(
    () =>
      [...order.timeline].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [order.timeline],
  )

  return (
    <aside className="aurelia-timeline-card">
      <h2 className="aurelia-timeline-title">Tracking Status</h2>
      {events.length === 0 ? (
        <p className="aurelia-muted">No tracking events yet.</p>
      ) : (
        <ol className="aurelia-timeline-list">
          {events.map((event, index) => {
            const display = STATUS_DISPLAY[event.status]
            const isActive = index === 0
            return (
              <li
                key={event.id}
                className={`aurelia-timeline-step ${isActive ? "is-active" : ""}`}
              >
                <span className="aurelia-timeline-dot" aria-hidden />
                <div className="aurelia-timeline-step-body">
                  <span className="aurelia-timeline-label">{display.label.toUpperCase()}</span>
                  <p className="aurelia-timeline-text">{event.note ?? display.description}</p>
                  <span className="aurelia-timeline-meta">{formatDateTime(event.createdAt)}</span>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </aside>
  )
}

const ItemDetailCard = ({
  productName,
  unitPrice,
  product,
}: {
  productName: string
  unitPrice: string
  product: Product | undefined
}) => {
  const image = product?.images?.[0]?.url
  const description =
    product?.description ??
    "Each piece is hand-selected and finished by our master artisans, designed to be passed through generations."

  return (
    <article className="aurelia-item-detail">
      <div className="aurelia-item-detail-image">
        {image ? (
          <img src={image} alt={productName} loading="lazy" />
        ) : (
          <div className="aurelia-item-detail-image-fallback" aria-hidden />
        )}
      </div>
      <div className="aurelia-item-detail-meta">
        <span className="aurelia-item-detail-kicker">From the Aurelia Atelier</span>
        <h3 className="aurelia-item-detail-title">{productName}</h3>
        <p className="aurelia-item-detail-copy">{description}</p>
        <dl className="aurelia-item-detail-stats">
          <div>
            <dt>Price</dt>
            <dd>{formatCurrency(unitPrice)}</dd>
          </div>
          {product?.stockQuantity !== undefined && (
            <div>
              <dt>Availability</dt>
              <dd>
                {product.stockQuantity > 0 ? `${product.stockQuantity} in atelier` : "Bespoke order"}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  )
}

const DeliveryAlertCard = ({ total }: { total: string }) => {
  const requiresSignature = Number(total) >= 1000

  if (!requiresSignature) {
    return null
  }

  return (
    <aside className="aurelia-account-alert" role="status">
      <span className="material-symbols-outlined aurelia-account-alert-icon">info</span>
      <div>
        <h4 className="aurelia-account-alert-title">Signature Required on Delivery</h4>
        <p className="aurelia-account-alert-copy">
          Due to the high value of your purchase, an adult signature is mandatory. If you are not
          available, please contact our concierge to schedule a secure pickup.
        </p>
        <Link to="/notifications" className="aurelia-account-alert-link">
          MANAGE DELIVERY PREFERENCES
        </Link>
      </div>
    </aside>
  )
}
