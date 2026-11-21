import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { OrderStatus } from "@jewellery/types"
import { Link, useNavigate } from "react-router-dom"
import { formatDisplayMoney } from "../../lib/display-currency"
import { useQueryLoadState } from "../../hooks/useQueryLoadState"
import { queryKeys } from "../../lib/query-keys"
import { queryTiming } from "../../lib/query-client"
import { fetchOrders } from "../../services/orders"
import { useAdminDisplayCurrency } from "../../stores/adminDisplayCurrencyStore"
import { useI18n, type TFunction } from "../../i18n"

type FilterId = "all" | "active" | "delivered" | "cancelled"

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped"]
const FILTERS: Array<{ id: FilterId; labelKey: string; matches: (status: OrderStatus) => boolean }> = [
  { id: "all", labelKey: "admin.orders.filter.all", matches: () => true },
  { id: "active", labelKey: "admin.orders.filter.active", matches: (status) => ACTIVE_STATUSES.includes(status) },
  { id: "delivered", labelKey: "admin.orders.filter.delivered", matches: (status) => status === "delivered" },
  { id: "cancelled", labelKey: "admin.orders.filter.cancelled", matches: (status) => status === "cancelled" },
]

const isActiveOrder = (status: OrderStatus) =>
  status === "pending" || status === "confirmed" || status === "shipped"
const clientLabel = (t: TFunction, userId: string) => t("admin.labels.client", { id: userId.slice(0, 6).toUpperCase() })
const tierLabel = (t: TFunction, id: string) => t("admin.labels.tier", { id: id.slice(0, 4).toUpperCase() })
const pieceLabel = (t: TFunction, id: string) => t("admin.labels.piece", { id: id.slice(0, 4).toUpperCase() })
const orderLabel = (id: string) => `#AUR-${id.slice(0, 4).toUpperCase()}`

export const AdminOrdersPage = () => {
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const locale = lang === "sq" ? "sq-AL" : "en-GB"
  const displayCurrency = useAdminDisplayCurrency()
  const ordersQuery = useQuery({
    queryKey: queryKeys.orders(),
    queryFn: fetchOrders,
    staleTime: queryTiming.sessionStaleTime,
  })
  const { data } = ordersQuery
  const { showSkeleton } = useQueryLoadState(ordersQuery)
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

  if (showSkeleton) {
    return (
      <div className="aurelia-admin-page" aria-busy="true" aria-live="polite" aria-label={t("admin.orders.loadingAria")}>
        <div className="aurelia-admin-page-header">
          <div>
            <p className="aurelia-admin-kicker mb-2">{t("admin.common.operations")}</p>
            <h1 className="aurelia-admin-title mb-0">{t("admin.orders.title")}</h1>
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
          <p className="aurelia-admin-kicker mb-2">{t("admin.common.operations")}</p>
          <h1 className="aurelia-admin-title mb-0">{t("admin.orders.title")}</h1>
        </div>
      </div>
      <section className="aurelia-admin-orders-section">
        <div className="aurelia-admin-orders-filters" role="tablist" aria-label={t("admin.orders.filterAria")}>
          {FILTERS.map((filterDef) => (
            <button
              key={filterDef.id}
              type="button"
              role="tab"
              aria-selected={filter === filterDef.id}
              className={`aurelia-admin-orders-filter-chip ${filter === filterDef.id ? "is-active" : ""}`}
              onClick={() => setFilter(filterDef.id)}
            >
              <span>{t(filterDef.labelKey)}</span>
              <span className="aurelia-admin-orders-filter-count">{counts[filterDef.id]}</span>
            </button>
          ))}
        </div>
        <div className="table-responsive aurelia-admin-table-wrap aurelia-admin-orders-table-wrap">
          <table className="table align-middle mb-0 aurelia-admin-table aurelia-admin-orders-table">
          <thead>
            <tr>
              <th>{t("admin.table.orderId")}</th>
              <th>{t("admin.table.customer")}</th>
              <th>{t("admin.table.piece")}</th>
              <th>{t("admin.table.status")}</th>
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
                aria-label={t("admin.common.openOrder", { id: orderLabel(o.id) })}
              >
                <td className="aurelia-admin-orders-id">
                  <strong>{orderLabel(o.id)}</strong>
                  <span>{new Date(o.createdAt).toLocaleDateString(locale)}</span>
                </td>
                <td className="aurelia-admin-orders-customer">
                  <strong>{clientLabel(t, o.userId)}</strong>
                  <span>{tierLabel(t, o.id)}</span>
                </td>
                <td className="aurelia-admin-orders-piece">
                  <strong>{pieceLabel(t, o.id)}</strong>
                  <span>
                    {t("admin.common.total")}{" "}
                    {formatDisplayMoney(Number(o.total), displayCurrency, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </td>
                <td>
                  <span className={`aurelia-admin-status-chip ${o.status === "delivered" ? "is-success" : o.status === "shipped" ? "is-info" : o.status === "confirmed" ? "is-warning" : o.status === "cancelled" ? "is-danger" : "is-muted"}`}>
                    {t(`admin.status.${o.status}`)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
          {orders.length > 0 && visibleOrders.length === 0 && (
            <div className="aurelia-admin-panel p-3 d-flex justify-content-between align-items-center flex-wrap gap-2 border-top-0">
              <p className="mb-0">{t("admin.orders.noneInView")}</p>
              <button type="button" className="aurelia-btn aurelia-btn-outline" onClick={() => setFilter("all")}>
                {t("admin.orders.showAll")}
              </button>
            </div>
          )}
          <div className="aurelia-admin-table-foot aurelia-admin-orders-foot">
            <span>
              {filter === "all" && t("admin.common.showingOrders", { shown: visibleOrders.length, total: orders.length })}
              {filter === "active" &&
                t(visibleOrders.length === 1 ? "admin.orders.showingActiveOne" : "admin.orders.showingActiveMany", { count: visibleOrders.length })}
              {filter === "delivered" &&
                t(visibleOrders.length === 1 ? "admin.orders.showingDeliveredOne" : "admin.orders.showingDeliveredMany", { count: visibleOrders.length })}
              {filter === "cancelled" &&
                t(visibleOrders.length === 1 ? "admin.orders.showingCancelledOne" : "admin.orders.showingCancelledMany", { count: visibleOrders.length })}
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
