import { useQuery } from "@tanstack/react-query"
import { FiMoreHorizontal } from "react-icons/fi"
import { Link } from "react-router-dom"
import { getDashboardMetrics } from "../../lib/admin-dashboard-metrics"
import { fetchOrders } from "../../services/orders"
import { fetchProducts } from "../../services/products"

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })

const statusTone = (status: string) => {
  if (status === "delivered") return "is-success"
  if (status === "shipped") return "is-info"
  if (status === "confirmed") return "is-warning"
  if (status === "cancelled") return "is-danger"
  return "is-muted"
}

const clientLabel = (userId: string) => `Client ${userId.slice(0, 6).toUpperCase()}`
const pieceLabel = (id: string) => `Bespoke Commission ${id.slice(0, 4).toUpperCase()}`

export const AdminDashboardPage = () => {
  const ordersQuery = useQuery({ queryKey: ["orders", "admin-dashboard"], queryFn: fetchOrders })
  const productsQuery = useQuery({ queryKey: ["products", "admin-dashboard"], queryFn: () => fetchProducts() })

  if (ordersQuery.isLoading || productsQuery.isLoading) {
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
          <p className="aurelia-admin-kpi-value is-money">{currency.format(metrics.weeklyRevenue)}</p>
          <p className="aurelia-admin-kpi-meta">Live from placed orders</p>
        </article>
        <article className="aurelia-admin-kpi-card">
          <p className="aurelia-admin-kpi-label">Pending Shipments</p>
          <p className="aurelia-admin-kpi-value">{metrics.pendingShipments}</p>
          <p className="aurelia-admin-kpi-meta">Confirmed + shipped</p>
        </article>
      </section>

      <section className="aurelia-admin-dashboard-table-section">
        <div className="aurelia-admin-dashboard-table-header">
          <div>
            <h2 className="aurelia-admin-card-title mb-2">Recent Boutique Orders</h2>
            <p className="aurelia-muted mb-0">A curated live view of current acquisitions and fulfilment progress.</p>
          </div>
          <Link className="aurelia-btn aurelia-btn-primary text-decoration-none" to="/admin/orders">
            Create New Order
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="aurelia-admin-panel p-4">
            <p className="mb-0">No orders available yet.</p>
          </div>
        ) : (
          <div className="aurelia-admin-table-wrap">
            <table className="table align-middle mb-0 aurelia-admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Piece</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="fw-semibold">#{order.id.slice(0, 8).toUpperCase()}</td>
                    <td>{clientLabel(order.userId)}</td>
                    <td>{pieceLabel(order.id)}</td>
                    <td>
                      <span className={`aurelia-admin-status-chip ${statusTone(order.status)}`}>{order.status}</span>
                    </td>
                    <td className="text-end">
                      <Link className="aurelia-admin-icon-link" to={`/admin/orders/${order.id}`} aria-label={`Open order ${order.id}`}>
                        <FiMoreHorizontal />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="aurelia-admin-table-foot">
              Showing {Math.min(recentOrders.length, 4)} of {orders.length} active orders
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
