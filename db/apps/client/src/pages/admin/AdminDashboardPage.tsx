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

const statusTone = (status: string) => {
  if (status === "delivered") return "is-success"
  if (status === "shipped") return "is-info"
  if (status === "confirmed") return "is-warning"
  if (status === "cancelled") return "is-danger"
  return "is-muted"
}

const clientLabel = (userId: string) => `Client ${userId.slice(0, 6).toUpperCase()}`
const tierLabel = (id: string) => `Tier ${id.slice(0, 4).toUpperCase()}`
const pieceLabel = (id: string) => `Signature Piece ${id.slice(0, 4).toUpperCase()}`
const orderLabel = (id: string) => `#AUR-${id.slice(0, 4).toUpperCase()}`

export const AdminDashboardPage = () => {
  const navigate = useNavigate()
  const displayCurrency = useAdminDisplayCurrency()
  const ordersQuery = useQuery({
    queryKey: queryKeys.orders(),
    queryFn: fetchOrders,
    staleTime: queryTiming.sessionStaleTime,
  })
  const productsQuery = useQuery({
    queryKey: queryKeys.products.adminDashboard(),
    queryFn: () => fetchProducts(),
    staleTime: queryTiming.catalogueStaleTime,
  })
  const { showSkeleton: ordersLoading } = useQueryLoadState(ordersQuery)
  const { showSkeleton: productsLoading } = useQueryLoadState(productsQuery)

  if (ordersLoading || productsLoading) {
    return (
      <div className="aurelia-admin-dashboard">
        <header className="aurelia-admin-dashboard-heading">
          <h1 className="aurelia-admin-title mb-0">Executive Overview</h1>
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
        <h1 className="aurelia-admin-title mb-3">Executive Overview</h1>
        <div className="aurelia-admin-panel p-4">
          <p className="mb-3">Unable to load dashboard insights right now.</p>
          <button
            type="button"
            className="aurelia-btn aurelia-btn-primary"
            onClick={() => {
              void ordersQuery.refetch()
              void productsQuery.refetch()
            }}
          >
            Retry
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
        <h1 className="aurelia-admin-title mb-2">Executive Overview</h1>
        <span className="aurelia-admin-dashboard-divider" />
      </header>

      <section className="aurelia-admin-kpi-grid" aria-label="Performance metrics">
        <article className="aurelia-admin-kpi-card">
          <p className="aurelia-admin-kpi-label">Active Bespoke Orders</p>
          <p className="aurelia-admin-kpi-value">{metrics.activeOrders}</p>
          <Link className="aurelia-admin-kpi-link" to="/admin/orders">
            View all
          </Link>
        </article>
        <article className="aurelia-admin-kpi-card">
          <p className="aurelia-admin-kpi-label">Inventory Alert</p>
          <p className="aurelia-admin-kpi-value">{metrics.inventoryAlert}</p>
          <p className="aurelia-admin-kpi-meta">Low stock</p>
        </article>
        <article className="aurelia-admin-kpi-card">
          <p className="aurelia-admin-kpi-label">Weekly Revenue</p>
          <p className="aurelia-admin-kpi-value is-money">
            {formatDisplayMoney(metrics.weeklyRevenue, displayCurrency, { maximumFractionDigits: 0 })}
          </p>
          <p className="aurelia-admin-kpi-meta">Live from placed orders</p>
        </article>
        <article className="aurelia-admin-kpi-card">
          <p className="aurelia-admin-kpi-label">Pending Shipments</p>
          <p className="aurelia-admin-kpi-value">{metrics.pendingShipments}</p>
          <p className="aurelia-admin-kpi-meta">Confirmed + shipped</p>
        </article>
      </section>

      <AdminDashboardCharts orders={orders} />

      <section className="aurelia-admin-dashboard-table-section">
        <div className="aurelia-admin-dashboard-table-header">
          <div>
            <h2 className="aurelia-admin-card-title mb-2">Recent Boutique Orders</h2>
            <p className="aurelia-muted mb-0">A curated live view of current acquisitions and fulfilment progress.</p>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="aurelia-admin-panel p-4">
            <p className="mb-0">No orders available yet.</p>
          </div>
        ) : (
          <div className="table-responsive aurelia-admin-table-wrap aurelia-admin-orders-table-wrap">
            <table className="table align-middle mb-0 aurelia-admin-table aurelia-admin-orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Piece</th>
                  <th>Status</th>
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
                    aria-label={`Open order ${orderLabel(order.id)}`}
                  >
                    <td className="aurelia-admin-orders-id">
                      <strong>{orderLabel(order.id)}</strong>
                      <span>{new Date(order.createdAt).toLocaleDateString("en-GB")}</span>
                    </td>
                    <td className="aurelia-admin-orders-customer">
                      <strong>{clientLabel(order.userId)}</strong>
                      <span>{tierLabel(order.id)}</span>
                    </td>
                    <td className="aurelia-admin-orders-piece">
                      <strong>{pieceLabel(order.id)}</strong>
                      <span>
                        Total{" "}
                        {formatDisplayMoney(Number(order.total), displayCurrency, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td>
                      <span className={`aurelia-admin-status-chip ${statusTone(order.status)}`}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="aurelia-admin-table-foot aurelia-admin-orders-foot">
              <span>
                Showing {recentOrders.length} of {orders.length} orders
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
          <img src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=80" alt="Luxury necklace spotlight" />
        </article>
        <article className="aurelia-admin-spotlight-panel">
          <p className="aurelia-admin-kicker mb-3">Master Inventory</p>
          <h2 className="aurelia-admin-card-title mb-3">Allocation Balance</h2>
          <p className="aurelia-muted mb-4">
            Global boutiques are showing elevated demand on signature pieces. Keep allocation and replenishment aligned with current stock pressure.
          </p>
          <div className="aurelia-admin-spotlight-row">
            <span>London Flagship</span>
            <strong>Surplus</strong>
          </div>
          <div className="aurelia-admin-spotlight-row">
            <span>Paris Atelier</span>
            <strong>Critical stock</strong>
          </div>
          <Link to="/admin/products" className="aurelia-btn aurelia-btn-outline text-decoration-none mt-3">
            Adjust allocation
          </Link>
        </article>
      </section>

      <footer className="aurelia-admin-dashboard-foot">
        <p className="mb-0">© 2024 Aurelia Luxury Jewellery Limited. All rights reserved.</p>
        <div>
          <a href="#">Terms of Service</a>
          <a href="#">Privacy Protocol</a>
        </div>
      </footer>
    </div>
  )
}
