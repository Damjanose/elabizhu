import { useEffect } from "react"
import { motion } from "motion/react"
import { Link, Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom"
import { FaTiktok } from "react-icons/fa"
import { FiInstagram, FiLayout, FiSearch } from "react-icons/fi"
import { INSTAGRAM_URL, TIKTOK_URL } from "./data/instagram"
import { Slide, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./styles/shell.css"
import { ErrorBoundary } from "./components/feedback/ErrorBoundary"
import { AdminRoute } from "./components/AdminRoute"
import { AdminShell } from "./components/admin/AdminShell"
import { GuestRoute } from "./components/GuestRoute"
import { UserMenu } from "./components/auth/UserMenu"
import { MobileTabBar } from "./components/nav/MobileTabBar"
import { NavIconHint } from "./components/nav/NavIconHint"
import { useI18n } from "./i18n"
import { useSocketLifecycle } from "./hooks/useSocketLifecycle"
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage"
import { AdminOrderDetailPage } from "./pages/admin/AdminOrderDetailPage"
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage"
import { AdminProductDetailPage } from "./pages/admin/AdminProductDetailPage"
import { AdminProductsPage } from "./pages/admin/AdminProductsPage"
import { AdminUsersPage } from "./pages/admin/AdminUsersPage"
import { CategoriesPage } from "./pages/CategoriesPage"
import { CategoryProductsPage } from "./pages/CategoryProductsPage"
import { HomePage } from "./pages/HomePage"
import { LoginPage } from "./pages/LoginPage"
import { NotFoundPage } from "./pages/NotFoundPage"
import { ProductDetailsPage } from "./pages/ProductDetailsPage"
import { ProductsPage } from "./pages/ProductsPage"
import { fadeUp } from "./lib/motion"
import { useAuth } from "./types/auth-context"
import { ADMIN_LOGIN_PATH } from "./utils/post-auth-redirect"

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `aurelia-nav-link${isActive ? " aurelia-nav-link-active" : ""}`

const Shell = () => {
  useSocketLifecycle()
  const { user } = useAuth()
  const { t, lang } = useI18n()
  const location = useLocation()
  const isAdminView = location.pathname.startsWith("/admin")
  const canAccessAdmin =
    user?.permissions.includes("admin") || user?.permissions.includes("administrator")

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <div
      className={`aurelia-app-shell min-vh-100${isAdminView ? " aurelia-app-shell--admin" : " aurelia-app-shell--with-tab-bar"}`}
    >
      {!isAdminView && (
        <nav className="aurelia-topbar sticky-top" aria-label={t("shell.nav.ariaLabel")}>
          <div className="aurelia-container aurelia-nav-grid">
            <div className="aurelia-nav-left">
              <div className="aurelia-nav-links">
                <NavLink className={navLinkClass} to="/products">
                  {t("shell.nav.shop")}
                </NavLink>
                <NavLink className={navLinkClass} to="/categories">
                  {t("shell.nav.categories")}
                </NavLink>
              </div>
            </div>

            <Link className="aurelia-brand text-decoration-none text-center" to="/">
              <img className="eb-brand-logo" src="/logo.jpg" alt="" width={36} height={36} />
              <span>ELABIZHU</span>
            </Link>

            <div className="aurelia-nav-right">
              <span className="aurelia-desktop-only">
                <NavIconHint label={t("shell.instagram.hint")}>
                  <a
                    className="aurelia-icon-link text-decoration-none"
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("shell.instagram.label")}
                  >
                    <FiInstagram />
                  </a>
                </NavIconHint>
                <NavIconHint label={t("shell.tiktok.hint")}>
                  <a
                    className="aurelia-icon-link text-decoration-none"
                    href={TIKTOK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("shell.tiktok.label")}
                  >
                    <FaTiktok />
                  </a>
                </NavIconHint>
              </span>
              <NavIconHint label={t("shell.search.label")}>
                <Link className="aurelia-icon-link text-decoration-none" to="/products" aria-label={t("shell.search.label")}>
                  <FiSearch />
                </Link>
              </NavIconHint>
              <span className="aurelia-desktop-only">
                <UserMenu />
              </span>
              {canAccessAdmin && (
                <NavIconHint label={t("shell.admin.hint")}>
                  <Link className="aurelia-icon-link text-decoration-none" to="/admin" aria-label={t("shell.admin.label")}>
                    <FiLayout />
                  </Link>
                </NavIconHint>
              )}
            </div>
          </div>
        </nav>
      )}
      <main className={isAdminView ? "aurelia-container aurelia-admin-main" : "aurelia-container py-4 py-md-5"}>
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path={ADMIN_LOGIN_PATH}
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:categoryId/products" element={<CategoryProductsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:productId" element={<ProductDetailsPage />} />

          {/* Retired customer pages: the store is public-only, ordering happens on Instagram. */}
          <Route path="/collections" element={<Navigate to="/products" replace />} />
          {["/journal", "/journal/:slug", "/cart", "/checkout", "/account", "/account/edit", "/orders", "/orders/:orderId", "/notifications"].map((p) => (
            <Route key={p} path={p} element={<Navigate to="/" replace />} />
          ))}

          <Route
            path="/admin"
            element={
              <AdminRoute requiredPermissions={["admin", "administrator"]}>
                <AdminShell />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/new" element={<AdminProductDetailPage />} />
            <Route path="products/:productId" element={<AdminProductDetailPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="orders/:orderId" element={<AdminOrderDetailPage />} />
            <Route
              path="users"
              element={
                <AdminRoute requiredPermissions={["admin"]}>
                  <AdminUsersPage />
                </AdminRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </ErrorBoundary>
      </main>
      {!isAdminView && <MobileTabBar />}
    </div>
  )
}

export const App = () => (
  <>
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
  
      <Shell />
    </motion.div>
    <ToastContainer
      className="aurelia-toast-container"
      transition={Slide}
      position="top-right"
      autoClose={3500}
      newestOnTop
      pauseOnFocusLoss={false}
      closeOnClick
      pauseOnHover
      draggable={false}
      theme="light"
      toastClassName="aurelia-toast"
    />
  </>
)
