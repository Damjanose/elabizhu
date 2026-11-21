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
import { useQueryLoadState } from "../hooks/useQueryLoadState"
import { queryKeys } from "../lib/query-keys"
import { queryTiming } from "../lib/query-client"
import { fetchNotifications } from "../services/notifications"
import { fetchOrder, fetchOrders } from "../services/orders"
import { fetchProduct } from "../services/products"
import { useI18n, type Lang } from "../i18n"

const STATUS_DISPLAY: Record<OrderStatus, { labelKey: string; descriptionKey: string }> = {
  pending: { labelKey: "account.status.pending", descriptionKey: "account.statusDesc.pending" },
  confirmed: { labelKey: "account.status.confirmed", descriptionKey: "account.statusDesc.confirmed" },
  shipped: { labelKey: "account.status.shipped", descriptionKey: "account.statusDesc.shipped" },
  delivered: { labelKey: "account.status.delivered", descriptionKey: "account.statusDesc.delivered" },
  cancelled: { labelKey: "account.status.cancelled", descriptionKey: "account.statusDesc.cancelled" },
}

const localeFor = (lang: Lang) => (lang === "sq" ? "sq-AL" : undefined)

const formatCurrency = (value: string, lang: Lang) => {
  const n = Number(value)
  if (Number.isNaN(n)) return value
  return n.toLocaleString(localeFor(lang), { style: "currency", currency: "EUR" })
}

const formatDate = (
  iso: string,
  lang: Lang,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(localeFor(lang), opts)
}

const formatDateTime = (iso: string, lang: Lang) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${formatDate(iso, lang)}, ${d.toLocaleTimeString(localeFor(lang), { hour: "2-digit", minute: "2-digit" })}`
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
  const { t } = useI18n()
  const { user } = useAuth()

  const ordersQuery = useQuery({
    queryKey: queryKeys.account.orders(),
    queryFn: fetchOrders,
    staleTime: queryTiming.sessionStaleTime,
  })
  const notificationsQuery = useQuery({
    queryKey: queryKeys.account.notifications(),
    queryFn: fetchNotifications,
    staleTime: queryTiming.sessionStaleTime,
  })
  const { showSkeleton: showOrdersSkeleton } = useQueryLoadState(ordersQuery)
  const { showSkeleton: showNotificationsSkeleton } = useQueryLoadState(notificationsQuery)

  const activeOrder = useMemo(() => pickActiveOrder(ordersQuery.data), [ordersQuery.data])

  const orderQuery = useQuery({
    queryKey: queryKeys.account.order(activeOrder?.id ?? ""),
    queryFn: () => (activeOrder ? fetchOrder(activeOrder.id) : Promise.reject()),
    enabled: !!activeOrder,
    staleTime: queryTiming.sessionStaleTime,
  })

  const featuredItem = orderQuery.data?.items?.[0]
  const productQuery = useQuery({
    queryKey: queryKeys.account.product(featuredItem?.productId ?? ""),
    queryFn: () => (featuredItem ? fetchProduct(featuredItem.productId) : Promise.reject()),
    enabled: !!featuredItem,
    staleTime: queryTiming.catalogueStaleTime,
  })
  const { showSkeleton: showOrderDetailSkeleton } = useQueryLoadState(orderQuery)

  const displayName = user?.fullName?.trim() || user?.email || t("account.overview.friend")
  const firstName = displayName.split(" ")[0]

  const unreadNotifications = useMemo(
    () => (notificationsQuery.data ?? []).filter((n) => !n.readAt),
    [notificationsQuery.data],
  )

  return (
    <section className="aurelia-account">
      <header className="aurelia-account-hero">
        <span className="aurelia-admin-kicker d-block mb-3">{t("account.common.personalAtelier")}</span>
        <h1 className="aurelia-account-hero-title">{t("account.overview.heroTitle", { name: firstName })}</h1>
        <p className="aurelia-account-hero-copy">{t("account.overview.heroCopy")}</p>
      </header>

      <div className="aurelia-bento">
        <ProfileCard
          name={user?.fullName?.trim() || displayName}
          email={user?.email ?? ""}
          tier={user && user.permissions.includes("admin") ? t("account.overview.tierDirector") : t("account.overview.tierCircle")}
        />

        <ActiveOrderCard
          order={activeOrder}
          orderDetail={orderQuery.data}
          loading={showOrdersSkeleton || (!!activeOrder && showOrderDetailSkeleton)}
        />

        <NotificationsCard
          loading={showNotificationsSkeleton}
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
}) => {
  const { t } = useI18n()
  return (
    <article className="aurelia-bento-card aurelia-bento-card--profile">
      <div className="aurelia-bento-card-head">
        <span className="material-symbols-outlined aurelia-bento-icon">account_circle</span>
        <Link to="/account/edit" className="aurelia-bento-action">{t("account.overview.edit")}</Link>
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
}

const ActiveOrderCard = ({
  order,
  orderDetail,
  loading,
}: {
  order: OrderSummary | undefined
  orderDetail: OrderDetail | undefined
  loading: boolean
}) => {
  const { t, lang } = useI18n()
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
          <span className="aurelia-bento-action aurelia-bento-action--inverse">{t("account.overview.newHere")}</span>
        </div>
        <div className="aurelia-bento-card-body">
          <h3 className="aurelia-bento-headline aurelia-bento-headline--inverse">{t("account.overview.beginTitle")}</h3>
          <p className="aurelia-bento-meta aurelia-bento-meta--inverse">
            {t("account.overview.beginCopy")}
          </p>
        </div>
        <div className="aurelia-bento-card-foot">
          <Link to="/products" className="aurelia-bento-button">
            {t("account.overview.exploreUpper")}
          </Link>
        </div>
      </article>
    )
  }

  const itemName = orderDetail?.items?.[0]?.productName ?? t("account.overview.curatedPiece")
  const orderId = `#AUR-${order.id.slice(0, 6).toUpperCase()}`
  const eta = formatDate(order.updatedAt, lang)
  const isActive = order.status !== "delivered" && order.status !== "cancelled"

  return (
    <article className="aurelia-bento-card aurelia-bento-card--order">
      <div className="aurelia-bento-card-head">
        <span className="material-symbols-outlined aurelia-bento-icon aurelia-bento-icon--inverse">
          auto_stories
        </span>
        <span className="aurelia-bento-action aurelia-bento-action--inverse">
          {isActive ? t("account.overview.activeOrder") : t("account.overview.recentOrder")}
        </span>
      </div>
      <div className="aurelia-bento-card-body">
        <h3 className="aurelia-bento-headline aurelia-bento-headline--inverse">{t("account.overview.orderTitle", { ref: orderId })}</h3>
        <p className="aurelia-bento-meta aurelia-bento-meta--inverse">{itemName}</p>
        <p className="aurelia-bento-meta aurelia-bento-meta--inverse aurelia-bento-meta--spaced">
          {isActive ? t("account.overview.estimatedDelivery", { date: eta }) : t("account.overview.completed", { date: eta })}
        </p>
      </div>
      <div className="aurelia-bento-card-foot">
        <Link to="/orders" className="aurelia-bento-button">
          {t("account.overview.viewHistory")}
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
  const { t } = useI18n()
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
          {unreadCount > 0 ? t("account.overview.newCount", { count: unreadCount }) : t("account.overview.allRead")}
        </span>
      </div>

      <div className="aurelia-bento-notifications">
        {notifications.length === 0 ? (
          <p className="aurelia-bento-meta">{t("account.overview.allCaughtUpCopy")}</p>
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
  const { t, lang } = useI18n()
  const events = useMemo(
    () =>
      [...order.timeline].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [order.timeline],
  )

  return (
    <aside className="aurelia-timeline-card">
      <h2 className="aurelia-timeline-title">{t("account.overview.trackingStatus")}</h2>
      {events.length === 0 ? (
        <p className="aurelia-muted">{t("account.overview.noEvents")}</p>
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
                  <span className="aurelia-timeline-label">{t(display.labelKey).toUpperCase()}</span>
                  <p className="aurelia-timeline-text">{event.note ?? t(display.descriptionKey)}</p>
                  <span className="aurelia-timeline-meta">{formatDateTime(event.createdAt, lang)}</span>
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
  const { t, lang } = useI18n()
  const image = product?.images?.[0]?.url
  const description = product?.description ?? t("account.overview.defaultDescription")

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
        <span className="aurelia-item-detail-kicker">{t("account.overview.fromAtelier")}</span>
        <h3 className="aurelia-item-detail-title">{productName}</h3>
        <p className="aurelia-item-detail-copy">{description}</p>
        <dl className="aurelia-item-detail-stats">
          <div>
            <dt>{t("account.overview.price")}</dt>
            <dd>{formatCurrency(unitPrice, lang)}</dd>
          </div>
          {product?.stockQuantity !== undefined && (
            <div>
              <dt>{t("account.overview.availability")}</dt>
              <dd>
                {product.stockQuantity > 0 ? t("account.overview.inAtelier", { count: product.stockQuantity }) : t("account.overview.bespokeOrder")}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  )
}

const DeliveryAlertCard = ({ total }: { total: string }) => {
  const { t } = useI18n()
  const requiresSignature = Number(total) >= 1000

  if (!requiresSignature) {
    return null
  }

  return (
    <aside className="aurelia-account-alert" role="status">
      <span className="material-symbols-outlined aurelia-account-alert-icon">info</span>
      <div>
        <h4 className="aurelia-account-alert-title">{t("account.overview.signatureTitle")}</h4>
        <p className="aurelia-account-alert-copy">
          {t("account.overview.signatureCopy")}
        </p>
        <Link to="/notifications" className="aurelia-account-alert-link">
          {t("account.overview.manageDelivery")}
        </Link>
      </div>
    </aside>
  )
}
