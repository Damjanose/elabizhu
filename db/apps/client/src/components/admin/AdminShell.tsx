import { FiGrid, FiHelpCircle, FiPackage, FiSearch, FiSettings, FiShoppingBag, FiUsers } from "react-icons/fi"
import { Link, NavLink, Outlet } from "react-router-dom"
import { useAuth } from "../../types/auth-context"
import { AdminCurrencySelect } from "./AdminCurrencySelect"
import { AdminOrderAlerts } from "./AdminOrderAlerts"
import { AdminShellUserMenu } from "./AdminShellUserMenu"
import { LanguageToggle } from "../nav/LanguageToggle"
import { useI18n } from "../../i18n"

const shellNavClass = ({ isActive }: { isActive: boolean }) =>
  `aurelia-admin-shell-nav-link${isActive ? " is-active" : ""}`

export const AdminShell = () => {
  const { user } = useAuth()
  const { t } = useI18n()
  const canManageUsers = user?.permissions.includes("admin")

  return (
    <div className="aurelia-admin-shell-bleed">
      <div className="aurelia-admin-shell">
        <aside className="aurelia-admin-shell-sidebar">
          <Link className="aurelia-admin-shell-brand text-decoration-none" to="/" aria-label={t("shell.admin.brandAria")}>
            <span className="aurelia-admin-shell-logo">ELABIZHU</span>
            <span className="aurelia-admin-shell-subtitle">{t("shell.admin.subtitle")}</span>
          </Link>

          <nav className="aurelia-admin-shell-nav" aria-label={t("shell.admin.navAria")}>
            <NavLink end to="/admin" className={shellNavClass}>
              <FiGrid />
              <span>{t("shell.admin.navDashboard")}</span>
            </NavLink>
            <NavLink to="/admin/products" className={shellNavClass}>
              <FiPackage />
              <span>{t("shell.admin.navProducts")}</span>
            </NavLink>
            <NavLink to="/admin/orders" className={shellNavClass}>
              <FiShoppingBag />
              <span>{t("shell.admin.navOrders")}</span>
            </NavLink>
            {canManageUsers && (
              <NavLink to="/admin/users" className={shellNavClass}>
                <FiUsers />
                <span>{t("shell.admin.navUsers")}</span>
              </NavLink>
            )}
          </nav>

          <div className="aurelia-admin-shell-sidebar-footer">
            <span className="aurelia-admin-shell-nav-link is-muted" aria-disabled>
              <FiSettings />
              <span>{t("shell.admin.settings")}</span>
            </span>
            <span className="aurelia-admin-shell-nav-link is-muted" aria-disabled>
              <FiHelpCircle />
              <span>{t("shell.admin.support")}</span>
            </span>
          </div>
        </aside>

        <section className="aurelia-admin-shell-main">
          <header className="aurelia-admin-shell-topbar">
            <label className="aurelia-admin-shell-search" aria-label={t("shell.admin.searchAria")}>
              <FiSearch />
              <input type="search" placeholder={t("shell.admin.searchPlaceholder")} />
            </label>
            <div className="aurelia-admin-shell-topbar-right">
              <AdminCurrencySelect />
              <LanguageToggle />
              <AdminOrderAlerts />
              <Link
                to="/admin/orders"
                className="aurelia-admin-shell-icon-btn"
                aria-label={t("shell.admin.ordersAria")}
                title={t("shell.admin.ordersTitle")}
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
