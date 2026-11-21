import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { OrderStatus, OrderSummary } from "@jewellery/types"
import { Link } from "react-router-dom"
import { EmptyState } from "../components/feedback/EmptyState"
import { useQueryLoadState } from "../hooks/useQueryLoadState"
import { queryKeys } from "../lib/query-keys"
import { queryTiming } from "../lib/query-client"
import { fetchOrders } from "../services/orders"
import { useI18n, type Lang } from "../i18n"

type FilterId = "all" | "active" | "delivered" | "cancelled"

const STATUS_DISPLAY: Record<OrderStatus, { labelKey: string; tone: "neutral" | "primary" | "secondary" | "success" | "danger" }> = {
  pending: { labelKey: "account.status.pending", tone: "neutral" },
  confirmed: { labelKey: "account.status.confirmed", tone: "primary" },
  shipped: { labelKey: "account.status.shipped", tone: "secondary" },
  delivered: { labelKey: "account.status.delivered", tone: "success" },
  cancelled: { labelKey: "account.status.cancelled", tone: "danger" },
}

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped"]

const FILTERS: Array<{ id: FilterId; labelKey: string; matches: (status: OrderStatus) => boolean }> = [
  { id: "all", labelKey: "account.orders.filterAll", matches: () => true },
  { id: "active", labelKey: "account.orders.filterActive", matches: (s) => ACTIVE_STATUSES.includes(s) },
  { id: "delivered", labelKey: "account.orders.filterDelivered", matches: (s) => s === "delivered" },
  { id: "cancelled", labelKey: "account.orders.filterCancelled", matches: (s) => s === "cancelled" },
]

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
  return d.toLocaleDateString(lang === "sq" ? "sq-AL" : undefined, { day: "numeric", month: "short", year: "numeric" })
}

const orderRef = (id: string) => `#AUR-${id.slice(0, 6).toUpperCase()}`

export const OrdersPage = () => {
  const { t } = useI18n()
  const ordersQuery = useQuery({
    queryKey: queryKeys.orders(),
    queryFn: fetchOrders,
    staleTime: queryTiming.sessionStaleTime,
  })
  const { data, isError, refetch, isFetching } = ordersQuery
  const { showSkeleton } = useQueryLoadState(ordersQuery)
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
        <span className="aurelia-admin-kicker d-block mb-3">{t("account.common.personalAtelier")}</span>
        <h1 className="aurelia-orders-hero-title">{t("account.orders.title")}</h1>
        <p className="aurelia-orders-hero-copy">{t("account.orders.copy")}</p>
      </header>

      <div className="aurelia-orders-toolbar" role="tablist" aria-label={t("account.orders.filterAria")}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`aurelia-orders-chip ${filter === f.id ? "is-active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            <span>{t(f.labelKey)}</span>
            <span className="aurelia-orders-chip-count">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {showSkeleton ? (
        <OrdersSkeleton />
      ) : isError ? (
        <EmptyState
          variant="card"
          tone="danger"
          icon="error"
          kicker={t("account.common.connectionIssue")}
          title={t("account.orders.errorTitle")}
          copy={t("account.common.unexpectedError")}
          cta={{ label: isFetching ? t("account.common.retrying") : t("account.common.tryAgain"), onClick: () => void refetch() }}
          secondaryCta={{ to: "/products", label: t("account.common.browseCollections") }}
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          variant="card"
          icon="auto_stories"
          kicker={t("account.orders.emptyKicker")}
          title={t("account.orders.emptyTitle")}
          copy={t("account.orders.emptyCopy")}
          cta={{ to: "/products", label: t("account.common.exploreCollections") }}
          secondaryCta={{ to: "/categories", label: t("account.common.shopByCategory") }}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          variant="card"
          icon="filter_alt"
          title={t("account.orders.noMatchTitle")}
          copy={t("account.orders.noMatchCopy")}
          cta={{ label: t("account.orders.showAll"), onClick: () => setFilter("all") }}
        />
      ) : (
        <OrdersTable orders={visible} />
      )}
    </section>
  )
}

const OrdersTable = ({ orders }: { orders: OrderSummary[] }) => {
  const { t, lang } = useI18n()
  return (
    <div className="aurelia-admin-table-wrap aurelia-orders-table-wrap">
      <table className="table align-middle mb-0 aurelia-admin-table aurelia-orders-table">
        <thead>
          <tr>
            <th>{t("account.orders.colId")}</th>
            <th>{t("account.orders.colPlaced")}</th>
            <th>{t("account.orders.colStatus")}</th>
            <th>{t("account.orders.colTotal")}</th>
            <th className="text-end">{t("account.orders.colActions")}</th>
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
                <td>{formatDate(order.createdAt, lang)}</td>
                <td>
                  <span className={`aurelia-admin-status-chip ${statusTone}`}>{t(display.labelKey)}</span>
                </td>
                <td>{formatCurrency(order.total, lang)}</td>
                <td className="text-end">
                  <Link to={`/orders/${order.id}`} className="aurelia-admin-icon-link" aria-label={t("account.orders.viewAria", { ref: orderRef(order.id) })}>
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
      <div className="aurelia-admin-table-foot">
        {orders.length === 1 ? t("account.orders.showingOne") : t("account.orders.showingMany", { count: orders.length })}
      </div>
    </div>
  )
}

const OrdersSkeleton = () => (
  <div className="aurelia-orders-skeleton" aria-busy="true" aria-live="polite">
    {[0, 1, 2].map((i) => (
      <div key={i} className="aurelia-orders-skeleton-row" />
    ))}
  </div>
)
