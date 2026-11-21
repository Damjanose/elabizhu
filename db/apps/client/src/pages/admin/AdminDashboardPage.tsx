import { useQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { getDashboardMetrics } from "../../lib/admin-dashboard-metrics"
import { formatDisplayMoney } from "../../lib/display-currency"
import { useQueryLoadState } from "../../hooks/useQueryLoadState"
import { queryKeys } from "../../lib/query-keys"
import { queryTiming } from "../../lib/query-client"
import { fetchOrders } from "../../services/orders"
import { fetchProducts } from "../../services/products"
import { useAdminDisplayCurrency } from "../../stores/adminDisplayCurrencyStore"
import { AdminDashboardCharts } from "./AdminDashboardCharts"
import { useI18n, type TFunction } from "../../i18n"

const statusTone = (status: string) => {
  if (status === "delivered") return "is-success"
  if (status === "shipped") return "is-info"
  if (status === "confirmed") return "is-warning"
  if (status === "cancelled") return "is-danger"
  return "is-muted"
}

const clientLabel = (t: TFunction, userId: string) => t("admin.labels.client", { id: userId.slice(0, 6).toUpperCase() })
const tierLabel = (t: TFunction, id: string) => t("admin.labels.tier", { id: id.slice(0, 4).toUpperCase() })
const pieceLabel = (t: TFunction, id: string) => t("admin.labels.piece", { id: id.slice(0, 4).toUpperCase() })
const orderLabel = (id: string) => `#AUR-${id.slice(0, 4).toUpperCase()}`

export const AdminDashboardPage = () => {
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const locale = lang === "sq" ? "sq-AL" : "en-GB"
  const displayCurrency = useAdminDisplayCurrency()
  const ordersQuery = useQuery({
    queryKey: queryKeys.orders(),
    queryFn: fetchOrders,
    staleTime: queryTiming.sessionStaleTime,
  })
  const productsQuery = useQuery({
    queryKey: queryKeys.products.adminDashboard(),
    queryFn: () => fetchProducts(),
    staleTime: queryTiming.sessionStaleTime,
  })
  const { showSkeleton: ordersLoading } = useQueryLoadState(ordersQuery)
  const { showSkeleton: productsLoading } = useQueryLoadState(productsQuery)

  if (ordersLoading || productsLoading) {
    return (
      <div className="aurelia-admin-dashboard">
        <header className="aurelia-admin-dashboard-heading">
          <h1 className="aurelia-admin-title mb-0">{t("admin.dashboard.title")}</h1>
        </header>
        <section className="aurelia-admin-kpi-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <article key={index} className="aurelia-admin-kpi-card is-loading" aria-hidden />
          ))}
        </section>
      </div>
    )
  }

  if (ordersQuery.isError || productsQuery.isError) {
    return (
      <div className="aurelia-admin-dashboard">
        <h1 className="aurelia-admin-title mb-3">{t("admin.dashboard.title")}</h1>
        <div className="aurelia-admin-panel p-4">
          <p className="mb-3">{t("admin.dashboard.loadError")}</p>
          <button
            type="button"
            className="aurelia-btn aurelia-btn-primary"
            onClick={() => {
              void ordersQuery.refetch()
              void productsQuery.refetch()
            }}
          >
            {t("admin.common.retry")}
          </button>
        </div>
      </div>
    )
  }

  const orders = ordersQuery.data ?? []
  const products = productsQuery.data ?? []
  const metrics = getDashboardMetrics(orders, products)
  const recentOrders = orders.slice(0, 4)

  return (
    <div className="aurelia-admin-dashboard">
      <header className="aurelia-admin-dashboard-heading">
        <h1 className="aurelia-admin-title mb-2">{t("admin.dashboard.title")}</h1>
        <span className="aurelia-admin-dashboard-divider" />
      </header>

      <section className="aurelia-admin-kpi-grid" aria-label={t("admin.dashboard.metricsAria")}>
        <article className="aurelia-admin-kpi-card">
          <p className="aurelia-admin-kpi-label">{t("admin.dashboard.activeOrders")}</p>
          <p className="aurelia-admin-kpi-value">{metrics.activeOrders}</p>
          <Link className="aurelia-admin-kpi-link" to="/admin/orders">
            {t("admin.dashboard.viewAll")}
          </Link>
        </article>
        <article className="aurelia-admin-kpi-card">
          <p className="aurelia-admin-kpi-label">{t("admin.dashboard.inventoryAlert")}</p>
          <p className="aurelia-admin-kpi-value">{metrics.inventoryAlert}</p>
          <p className="aurelia-admin-kpi-meta">{t("admin.dashboard.lowStock")}</p>
        </article>
        <article className="aurelia-admin-kpi-card">
          <p className="aurelia-admin-kpi-label">{t("admin.dashboard.weeklyRevenue")}</p>
          <p className="aurelia-admin-kpi-value is-money">
            {formatDisplayMoney(metrics.weeklyRevenue, displayCurrency, { maximumFractionDigits: 0 })}
          </p>
          <p className="aurelia-admin-kpi-meta">{t("admin.dashboard.liveFromOrders")}</p>
        </article>
        <article className="aurelia-admin-kpi-card">
          <p className="aurelia-admin-kpi-label">{t("admin.dashboard.pendingShipments")}</p>
          <p className="aurelia-admin-kpi-value">{metrics.pendingShipments}</p>
          <p className="aurelia-admin-kpi-meta">{t("admin.dashboard.confirmedShipped")}</p>
        </article>
      </section>

      <AdminDashboardCharts orders={orders} />

      <section className="aurelia-admin-dashboard-table-section">
        <div className="aurelia-admin-dashboard-table-header">
          <div>
            <h2 className="aurelia-admin-card-title mb-2">{t("admin.dashboard.recentOrders")}</h2>
            <p className="aurelia-muted mb-0">{t("admin.dashboard.recentOrdersSub")}</p>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="aurelia-admin-panel p-4">
            <p className="mb-0">{t("admin.dashboard.noOrders")}</p>
          </div>
        ) : (
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
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="aurelia-admin-orders-row aurelia-admin-orders-row--clickable"
                    role="link"
                    tabIndex={0}
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        navigate(`/admin/orders/${order.id}`)
                      }
                    }}
                    aria-label={t("admin.common.openOrder", { id: orderLabel(order.id) })}
                  >
                    <td className="aurelia-admin-orders-id">
                      <strong>{orderLabel(order.id)}</strong>
                      <span>{new Date(order.createdAt).toLocaleDateString(locale)}</span>
                    </td>
                    <td className="aurelia-admin-orders-customer">
                      <strong>{clientLabel(t, order.userId)}</strong>
                      <span>{tierLabel(t, order.id)}</span>
                    </td>
                    <td className="aurelia-admin-orders-piece">
                      <strong>{pieceLabel(t, order.id)}</strong>
                      <span>
                        {t("admin.common.total")}{" "}
                        {formatDisplayMoney(Number(order.total), displayCurrency, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td>
                      <span className={`aurelia-admin-status-chip ${statusTone(order.status)}`}>{t(`admin.status.${order.status}`)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="aurelia-admin-table-foot aurelia-admin-orders-foot">
              <span>
                {t("admin.common.showingOrders", { shown: recentOrders.length, total: orders.length })}
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
        )}
      </section>

      <section className="aurelia-admin-spotlight-grid">
        <article className="aurelia-admin-spotlight-image">
          <img src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=80" alt={t("admin.dashboard.spotlightAlt")} />
        </article>
        <article className="aurelia-admin-spotlight-panel">
          <p className="aurelia-admin-kicker mb-3">{t("admin.dashboard.masterInventory")}</p>
          <h2 className="aurelia-admin-card-title mb-3">{t("admin.dashboard.allocationBalance")}</h2>
          <p className="aurelia-muted mb-4">
            {t("admin.dashboard.allocationBody")}
          </p>
          <div className="aurelia-admin-spotlight-row">
            <span>{t("admin.dashboard.londonFlagship")}</span>
            <strong>{t("admin.dashboard.surplus")}</strong>
          </div>
          <div className="aurelia-admin-spotlight-row">
            <span>{t("admin.dashboard.parisAtelier")}</span>
            <strong>{t("admin.dashboard.criticalStock")}</strong>
          </div>
          <Link to="/admin/products" className="aurelia-btn aurelia-btn-outline text-decoration-none mt-3">
            {t("admin.dashboard.adjustAllocation")}
          </Link>
        </article>
      </section>

      <footer className="aurelia-admin-dashboard-foot">
        <p className="mb-0">{t("admin.dashboard.copyright")}</p>
        <div>
          <a href="#">{t("admin.dashboard.terms")}</a>
          <a href="#">{t("admin.dashboard.privacy")}</a>
        </div>
      </footer>
    </div>
  )
}
