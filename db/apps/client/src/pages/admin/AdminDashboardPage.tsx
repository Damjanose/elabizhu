import { Link } from "react-router-dom"

export const AdminDashboardPage = () => (
  <div className="aurelia-admin-page">
    <div className="mb-4">
      <p className="aurelia-admin-kicker mb-2">Private Atelier</p>
      <h1 className="aurelia-admin-title mb-2">Dashboard</h1>
      <p className="aurelia-muted mb-0">Manage inventory and fulfilment with the same luxury storefront language.</p>
    </div>
    <div className="row g-4">
      <div className="col-md-6">
        <Link className="aurelia-admin-card text-decoration-none h-100" to="/admin/products">
          <div className="p-4">
            <h2 className="aurelia-admin-card-title">Products</h2>
            <p className="aurelia-muted small mb-0">Urgency flags, stock and editorial media curation.</p>
          </div>
        </Link>
      </div>
      <div className="col-md-6">
        <Link className="aurelia-admin-card text-decoration-none h-100" to="/admin/orders">
          <div className="p-4">
            <h2 className="aurelia-admin-card-title">Orders</h2>
            <p className="aurelia-muted small mb-0">Lifecycle transitions, delivery milestones and notifications.</p>
          </div>
        </Link>
      </div>
    </div>
  </div>
)
