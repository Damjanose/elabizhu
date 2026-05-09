import { FiGrid, FiHelpCircle, FiPackage, FiSearch, FiSettings, FiShoppingBag, FiUsers } from "react-icons/fi"
import { Link, NavLink, Outlet } from "react-router-dom"
import { useAuth } from "../../types/auth-context"
import { AdminCurrencySelect } from "./AdminCurrencySelect"
import { AdminOrderAlerts } from "./AdminOrderAlerts"
import { AdminShellUserMenu } from "./AdminShellUserMenu"

const shellNavClass = ({ isActive }: { isActive: boolean }) =>
  `aurelia-admin-shell-nav-link${isActive ? " is-active" : ""}`

export const AdminShell = () => {
  const { user } = useAuth()
  const canManageUsers = user?.permissions.includes("admin")

  return (
    <div className="aurelia-admin-shell-bleed">
      <div className="aurelia-admin-shell">
        <aside className="aurelia-admin-shell-sidebar">
          <div className="aurelia-admin-shell-brand">
            <span className="aurelia-admin-shell-logo">AURELIA</span>
            <span className="aurelia-admin-shell-subtitle">Luxury Admin</span>
          </div>

          <nav className="aurelia-admin-shell-nav" aria-label="Admin navigation">
            <NavLink end to="/admin" className={shellNavClass}>
              <FiGrid />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/admin/products" className={shellNavClass}>
              <FiPackage />
              <span>Products</span>
            </NavLink>
            <NavLink to="/admin/orders" className={shellNavClass}>
              <FiShoppingBag />
              <span>Orders</span>
            </NavLink>
            {canManageUsers && (
              <NavLink to="/admin/users" className={shellNavClass}>
                <FiUsers />
                <span>Users</span>
              </NavLink>
            )}
          </nav>

          <div className="aurelia-admin-shell-sidebar-footer">
            <span className="aurelia-admin-shell-nav-link is-muted" aria-disabled>
              <FiSettings />
              <span>Settings</span>
            </span>
            <span className="aurelia-admin-shell-nav-link is-muted" aria-disabled>
              <FiHelpCircle />
              <span>Support</span>
            </span>
          </div>
        </aside>

        <section className="aurelia-admin-shell-main">
          <header className="aurelia-admin-shell-topbar">
            <label className="aurelia-admin-shell-search" aria-label="Search admin records">
              <FiSearch />
              <input type="search" placeholder="Search orders, clients, pieces..." />
            </label>
            <div className="aurelia-admin-shell-topbar-right">
              <AdminCurrencySelect />
              <AdminOrderAlerts />
              <Link
                to="/admin/orders"
                className="aurelia-admin-shell-icon-btn"
                aria-label="Admin orders"
                title="Orders queue"
              >
                <FiShoppingBag />
              </Link>
              <AdminShellUserMenu />
            </div>
          </header>

          <div className="aurelia-admin-shell-content">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  )
}
