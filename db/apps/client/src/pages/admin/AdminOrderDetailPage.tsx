import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Link, useParams } from "react-router-dom"
import type { OrderStatus } from "@jewellery/types"
import { OrderTimeline } from "../../components/order/OrderTimeline"
import { EmptyState } from "../../components/feedback/EmptyState"
import { useQueryLoadState } from "../../hooks/useQueryLoadState"
import { queryKeys } from "../../lib/query-keys"
import { queryTiming } from "../../lib/query-client"
import { formatDisplayMoney } from "../../lib/display-currency"
import { fetchOrder, updateOrderStatus } from "../../services/orders"
import { useAdminDisplayCurrency } from "../../stores/adminDisplayCurrencyStore"
import { useI18n, type TFunction } from "../../i18n"

const TAX_RATE = 0.2

const STATUS_DISPLAY: Record<
  OrderStatus,
  { labelKey: string; tone: "neutral" | "primary" | "secondary" | "success" | "danger"; copyKey: string }
> = {
  pending: {
    labelKey: "admin.status.pending",
    tone: "neutral",
    copyKey: "admin.orderDetail.copy.pending",
  },
  confirmed: {
    labelKey: "admin.status.confirmed",
    tone: "primary",
    copyKey: "admin.orderDetail.copy.confirmed",
  },
  shipped: {
    labelKey: "admin.orderDetail.inTransit",
    tone: "secondary",
    copyKey: "admin.orderDetail.copy.shipped",
  },
  delivered: {
    labelKey: "admin.status.delivered",
    tone: "success",
    copyKey: "admin.orderDetail.copy.delivered",
  },
  cancelled: {
    labelKey: "admin.status.cancelled",
    tone: "danger",
    copyKey: "admin.orderDetail.copy.cancelled",
  },
}

const PAYMENT_LABEL_KEYS: Record<string, string> = {
  card: "admin.orderDetail.paymentCard",
  cod: "admin.orderDetail.paymentCod",
  bank: "admin.orderDetail.paymentBank",
}

const formatDate = (iso: string, locale: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d)
}

const orderRef = (id: string) => `#AUR-${id.slice(0, 6).toUpperCase()}`

const formatPayment = (t: TFunction, raw: string | null) => {
  if (!raw) return t("admin.orderDetail.paymentNotRecorded")
  const key = PAYMENT_LABEL_KEYS[raw]
  return key ? t(key) : raw.replace(/_/g, " ")
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

const statusLabel = (t: TFunction, status: OrderStatus) => t(`admin.status.${status}`)

export const AdminOrderDetailPage = () => {
  const { t, lang } = useI18n()
  const locale = lang === "sq" ? "sq-AL" : "en-GB"
  const displayCurrency = useAdminDisplayCurrency()
  const formatMoney = (value: string | number) =>
    formatDisplayMoney(Number(value), displayCurrency, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const queryClient = useQueryClient()
  const { orderId = "" } = useParams<{ orderId: string }>()
  const [confirmStatus, setConfirmStatus] = useState<OrderStatus | null>(null)
  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => fetchOrder(orderId),
    enabled: !!orderId,
    retry: false,
    staleTime: queryTiming.sessionStaleTime,
  })
  const { data, isError, error, refetch, isFetching } = orderQuery
  const { showSkeleton } = useQueryLoadState(orderQuery)
  const patch = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(orderId, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.orders() }),
      ])
    },
  })

  if (showSkeleton) {
    return (
      <section className="aurelia-detail-shell" aria-busy="true" aria-live="polite" aria-label={t("admin.orderDetail.loadingAria")}>
        <div className="aurelia-detail-skeleton-back aurelia-shimmer-block" aria-hidden />
        <div className="aurelia-detail-skeleton-hero" aria-hidden>
          <div>
            <div className="aurelia-detail-skeleton-line aurelia-detail-skeleton-line--short aurelia-shimmer-block" />
            <div className="aurelia-detail-skeleton-line aurelia-detail-skeleton-line--title aurelia-shimmer-block" />
            <div className="aurelia-detail-skeleton-line aurelia-detail-skeleton-line--short aurelia-shimmer-block" />
          </div>
          <div>
            <div className="aurelia-detail-skeleton-line aurelia-detail-skeleton-line--short aurelia-shimmer-block" />
            <div className="aurelia-detail-skeleton-line aurelia-shimmer-block" />
          </div>
        </div>
        <div className="aurelia-detail-skeleton-card aurelia-shimmer-block" aria-hidden />
        <div className="aurelia-detail-skeleton-card aurelia-shimmer-block" aria-hidden />
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
            kicker={t("admin.orderDetail.notFoundKicker")}
            title={t("admin.orderDetail.notFoundTitle")}
            copy={t("admin.orderDetail.notFoundCopy")}
            cta={{ to: "/admin/orders", label: t("admin.orderDetail.backToOrders") }}
            secondaryCta={{ to: "/admin", label: t("admin.common.backToDashboard") }}
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
          kicker={t("admin.orderDetail.errorKicker")}
          title={t("admin.orderDetail.errorTitle")}
          copy={t("admin.orderDetail.errorCopy")}
          cta={{ label: isFetching ? t("admin.common.retrying") : t("admin.common.tryAgain"), onClick: () => void refetch() }}
          secondaryCta={{ to: "/admin/orders", label: t("admin.orderDetail.backToOrders") }}
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
        <span>{t("admin.orderDetail.backToOrders")}</span>
      </Link>

      <header className="aurelia-order-detail-hero">
        <div className="aurelia-order-detail-hero-meta">
          <span className="aurelia-order-detail-kicker">{t("admin.orderDetail.referenceKicker")}</span>
          <h1 className="aurelia-order-detail-ref">{orderRef(data.id)}</h1>
          <p className="aurelia-order-detail-placed">{t("admin.orderDetail.placedOn", { date: formatDate(data.createdAt, locale) })}</p>
        </div>
        <div className="aurelia-order-detail-hero-status">
          <span
            className={`aurelia-orders-status aurelia-orders-status--${display.tone} aurelia-order-detail-status`}
          >
            <span className="aurelia-orders-status-dot" aria-hidden />
            {t(display.labelKey)}
          </span>
          <p className="aurelia-order-detail-status-copy">{t(display.copyKey)}</p>
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
                  {t(`admin.status.${status}`)}
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
              <h2 className="aurelia-order-detail-card-title">{t("admin.orderDetail.items")}</h2>
              <span className="aurelia-order-detail-card-meta">
                {t(itemCount === 1 ? "admin.orderDetail.piecesOne" : "admin.orderDetail.piecesMany", { count: itemCount })}
              </span>
            </header>

            {data.items.length === 0 ? (
              <EmptyState
                variant="inline"
                icon="inventory_2"
                title={t("admin.orderDetail.noItems")}
                copy={t("admin.orderDetail.noItemsCopy")}
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
                        {t("admin.orderDetail.eachQty", { price: formatMoney(item.unitPrice), qty: item.quantity })}
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
                <dt>{t("admin.orderDetail.subtotal")}</dt>
                <dd>{formatMoney(itemSubtotal)}</dd>
              </div>
              <div>
                <dt>{t("admin.orderDetail.estimatedTaxes")}</dt>
                <dd>{formatMoney(estimatedTax)}</dd>
              </div>
              <div>
                <dt>{t("admin.orderDetail.shipping")}</dt>
                <dd className="aurelia-order-detail-shipping">{t("admin.orderDetail.complimentary")}</dd>
              </div>
              <div className="aurelia-order-detail-totals-final">
                <dt>{t("admin.orderDetail.totalPaid")}</dt>
                <dd>{formatMoney(data.total)}</dd>
              </div>
            </dl>
          </article>

          <article className="aurelia-order-detail-card">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">{t("admin.orderDetail.tracking")}</h2>
            </header>
            {data.timeline.length === 0 ? (
              <EmptyState
                variant="inline"
                icon="timeline"
                title={t("admin.orderDetail.noTracking")}
                copy={t("admin.orderDetail.noTrackingCopy")}
              />
            ) : (
              <OrderTimeline events={data.timeline} />
            )}
          </article>
        </div>

        <aside className="aurelia-order-detail-aside">
          <article className="aurelia-order-detail-card">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">{t("admin.orderDetail.shipping")}</h2>
              <span className="material-symbols-outlined aurelia-order-detail-card-icon" aria-hidden>
                local_shipping
              </span>
            </header>
            {data.shippingAddress ? (
              <address className="aurelia-order-detail-address">{data.shippingAddress}</address>
            ) : (
              <p className="aurelia-order-detail-empty">{t("admin.orderDetail.noAddress")}</p>
            )}
          </article>

          <article className="aurelia-order-detail-card">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">{t("admin.orderDetail.payment")}</h2>
              <span className="material-symbols-outlined aurelia-order-detail-card-icon" aria-hidden>
                lock
              </span>
            </header>
            <p className="aurelia-order-detail-payment">{formatPayment(t, data.paymentMethod)}</p>
            <p className="aurelia-order-detail-payment-note">
              {t("admin.orderDetail.paymentNote")}
            </p>
          </article>
        </aside>
      </div>
      {confirmStatus && (
        <div className="aurelia-admin-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-detail-confirm-title">
          <div className="aurelia-admin-confirm-modal">
            <p className="aurelia-admin-kicker mb-2">{t("admin.orderDetail.confirmKicker")}</p>
            <h3 id="admin-detail-confirm-title" className="aurelia-admin-card-title mb-2">
              {t("admin.orderDetail.moveTo", { status: statusLabel(t, confirmStatus) })}
            </h3>
            <p className="aurelia-muted mb-3">
              {t("admin.orderDetail.moveFromTo", { from: statusLabel(t, data.status), to: statusLabel(t, confirmStatus) })}
            </p>
            <div className="aurelia-admin-confirm-actions">
              <button type="button" className="aurelia-btn aurelia-btn-outline" onClick={() => setConfirmStatus(null)}>
                {t("admin.common.back")}
              </button>
              <button
                type="button"
                className={`aurelia-btn aurelia-admin-next-step-btn ${nextStepTone(confirmStatus)}`}
                disabled={patch.isPending}
                onClick={() => {
                  void patch.mutateAsync(confirmStatus).then(() => setConfirmStatus(null))
                }}
              >
                {patch.isPending ? t("admin.common.updating") : t("admin.orderDetail.confirmStatus", { status: statusLabel(t, confirmStatus) })}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
