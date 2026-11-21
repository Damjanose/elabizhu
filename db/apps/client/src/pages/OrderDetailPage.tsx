import { useQuery } from "@tanstack/react-query"
import { INSTAGRAM_URL } from "../data/instagram"
import { isAxiosError } from "axios"
import { Link, useParams } from "react-router-dom"
import type { OrderStatus } from "@jewellery/types"
import { OrderTimeline } from "../components/order/OrderTimeline"
import { EmptyState } from "../components/feedback/EmptyState"
import { useQueryLoadState } from "../hooks/useQueryLoadState"
import { queryKeys } from "../lib/query-keys"
import { queryTiming } from "../lib/query-client"
import { fetchOrder } from "../services/orders"
import { useI18n, type Lang, type TFunction } from "../i18n"

const TAX_RATE = 0.2

const STATUS_DISPLAY: Record<
  OrderStatus,
  { labelKey: string; tone: "neutral" | "primary" | "secondary" | "success" | "danger"; copyKey: string }
> = {
  pending: {
    labelKey: "account.status.pending",
    tone: "neutral",
    copyKey: "account.detail.copy.pending",
  },
  confirmed: {
    labelKey: "account.status.confirmed",
    tone: "primary",
    copyKey: "account.detail.copy.confirmed",
  },
  shipped: {
    labelKey: "account.detail.inTransit",
    tone: "secondary",
    copyKey: "account.detail.copy.shipped",
  },
  delivered: {
    labelKey: "account.status.delivered",
    tone: "success",
    copyKey: "account.detail.copy.delivered",
  },
  cancelled: {
    labelKey: "account.status.cancelled",
    tone: "danger",
    copyKey: "account.detail.copy.cancelled",
  },
}

const PAYMENT_KEYS: Record<string, string> = {
  card: "account.checkout.paymentCard",
  cod: "account.checkout.paymentCod",
  bank: "account.checkout.paymentBank",
}

const localeFor = (lang: Lang) => (lang === "sq" ? "sq-AL" : "en-GB")

const formatCurrency = (value: string | number, lang: Lang) =>
  new Intl.NumberFormat(localeFor(lang), {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))

const formatDate = (iso: string, lang: Lang) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat(localeFor(lang), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d)
}

const orderRef = (id: string) => `#AUR-${id.slice(0, 6).toUpperCase()}`

const formatPayment = (raw: string | null, t: TFunction) => {
  if (!raw) return t("account.detail.paymentNotRecorded")
  return PAYMENT_KEYS[raw] ? t(PAYMENT_KEYS[raw]) : raw.replace(/_/g, " ")
}

export const OrderDetailPage = () => {
  const { t, lang } = useI18n()
  const { orderId = "" } = useParams<{ orderId: string }>()
  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => fetchOrder(orderId),
    enabled: !!orderId,
    retry: false,
    staleTime: queryTiming.sessionStaleTime,
  })
  const { data, isError, error, refetch, isFetching } = orderQuery
  const { showSkeleton } = useQueryLoadState(orderQuery)

  if (showSkeleton) {
    return (
      <section className="aurelia-order-detail" aria-busy="true" aria-live="polite" aria-label={t("account.detail.loadingAria")}>
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
            kicker={t("account.detail.notFoundKicker")}
            title={t("account.detail.notFoundTitle")}
            copy={t("account.detail.notFoundCopy")}
            cta={{ to: "/orders", label: t("account.common.backToOrders") }}
            secondaryCta={{ to: "/products", label: t("account.common.browseCollections") }}
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
          kicker={t("account.detail.errorKicker")}
          title={t("account.detail.errorTitle")}
          copy={t("account.common.unexpectedError")}
          cta={{ label: isFetching ? t("account.common.retrying") : t("account.common.tryAgain"), onClick: () => void refetch() }}
          secondaryCta={{ to: "/orders", label: t("account.common.backToOrders") }}
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
        <span>{t("account.common.backToOrders")}</span>
      </Link>

      <header className="aurelia-order-detail-hero">
        <div className="aurelia-order-detail-hero-meta">
          <span className="aurelia-order-detail-kicker">{t("account.detail.reference")}</span>
          <h1 className="aurelia-order-detail-ref">{orderRef(data.id)}</h1>
          <p className="aurelia-order-detail-placed">{t("account.detail.placedOn", { date: formatDate(data.createdAt, lang) })}</p>
        </div>
        <div className="aurelia-order-detail-hero-status">
          <span
            className={`aurelia-orders-status aurelia-orders-status--${display.tone} aurelia-order-detail-status`}
          >
            <span className="aurelia-orders-status-dot" aria-hidden />
            {t(display.labelKey)}
          </span>
          <p className="aurelia-order-detail-status-copy">{t(display.copyKey)}</p>
        </div>
      </header>

      <div className="aurelia-order-detail-grid">
        <div className="aurelia-order-detail-main">
          <article className="aurelia-order-detail-card">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">{t("account.detail.itemsTitle")}</h2>
              <span className="aurelia-order-detail-card-meta">
                {itemCount === 1 ? t("account.detail.piecesOne", { count: itemCount }) : t("account.detail.piecesMany", { count: itemCount })}
              </span>
            </header>

            {data.items.length === 0 ? (
              <EmptyState
                variant="inline"
                icon="inventory_2"
                title={t("account.detail.noItemsTitle")}
                copy={t("account.detail.noItemsCopy")}
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
                        {t("account.detail.itemSub", { price: formatCurrency(item.unitPrice, lang), quantity: item.quantity })}
                      </p>
                    </div>
                    <span className="aurelia-order-item-total">
                      {formatCurrency(Number(item.unitPrice) * item.quantity, lang)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <dl className="aurelia-order-detail-totals">
              <div>
                <dt>{t("account.summary.subtotal")}</dt>
                <dd>{formatCurrency(itemSubtotal, lang)}</dd>
              </div>
              <div>
                <dt>{t("account.summary.estimatedTaxes")}</dt>
                <dd>{formatCurrency(estimatedTax, lang)}</dd>
              </div>
              <div>
                <dt>{t("account.summary.shipping")}</dt>
                <dd className="aurelia-order-detail-shipping">{t("account.common.complimentary")}</dd>
              </div>
              <div className="aurelia-order-detail-totals-final">
                <dt>{t("account.summary.totalPaid")}</dt>
                <dd>{formatCurrency(data.total, lang)}</dd>
              </div>
            </dl>
          </article>

          <article className="aurelia-order-detail-card">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">{t("account.detail.timelineTitle")}</h2>
            </header>
            {data.timeline.length === 0 ? (
              <EmptyState
                variant="inline"
                icon="timeline"
                title={t("account.detail.noEventsTitle")}
                copy={t("account.detail.noEventsCopy")}
              />
            ) : (
              <OrderTimeline events={data.timeline} />
            )}
          </article>
        </div>

        <aside className="aurelia-order-detail-aside">
          <article className="aurelia-order-detail-card">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">{t("account.detail.shippingTitle")}</h2>
              <span className="material-symbols-outlined aurelia-order-detail-card-icon" aria-hidden>
                local_shipping
              </span>
            </header>
            {data.shippingAddress ? (
              <address className="aurelia-order-detail-address">{data.shippingAddress}</address>
            ) : (
              <p className="aurelia-order-detail-empty">{t("account.detail.noAddress")}</p>
            )}
          </article>

          <article className="aurelia-order-detail-card">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">{t("account.detail.paymentTitle")}</h2>
              <span className="material-symbols-outlined aurelia-order-detail-card-icon" aria-hidden>
                lock
              </span>
            </header>
            <p className="aurelia-order-detail-payment">{formatPayment(data.paymentMethod, t)}</p>
            <p className="aurelia-order-detail-payment-note">
              {t("account.detail.paymentSecure")}
            </p>
          </article>

          <article className="aurelia-order-detail-card aurelia-order-detail-concierge">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">{t("account.detail.conciergeTitle")}</h2>
              <span className="material-symbols-outlined aurelia-order-detail-card-icon" aria-hidden>
                support_agent
              </span>
            </header>
            <p className="aurelia-order-detail-concierge-copy">
              {t("account.detail.conciergeCopy")}
            </p>
            <a
              className="aurelia-order-detail-concierge-link"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{t("account.detail.contactConcierge")}</span>
              <span className="material-symbols-outlined" aria-hidden>arrow_forward</span>
            </a>
          </article>
        </aside>
      </div>
    </section>
  )
}
