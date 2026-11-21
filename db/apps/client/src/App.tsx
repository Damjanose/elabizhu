import { useEffect } from "react"
import { motion } from "motion/react"
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom"
import { FiInstagram, FiLayout, FiSearch, FiShoppingBag } from "react-icons/fi"
import { INSTAGRAM_URL } from "./data/instagram"
import { Slide, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./styles/shell.css"
import { ErrorBoundary } from "./components/feedback/ErrorBoundary"
import { AdminRoute } from "./components/AdminRoute"
import { AdminShell } from "./components/admin/AdminShell"
import { GuestRoute } from "./components/GuestRoute"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { UserMenu } from "./components/auth/UserMenu"
import { LanguageToggle } from "./components/nav/LanguageToggle"
import { MobileTabBar } from "./components/nav/MobileTabBar"
import { NavIconHint } from "./components/nav/NavIconHint"
import { useI18n } from "./i18n"
import { useCart } from "./hooks/useCart"
import { useSocketLifecycle } from "./hooks/useSocketLifecycle"
import { AccountPage } from "./pages/AccountPage"
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage"
import { AdminOrderDetailPage } from "./pages/admin/AdminOrderDetailPage"
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage"
import { AdminProductDetailPage } from "./pages/admin/AdminProductDetailPage"
import { AdminProductsPage } from "./pages/admin/AdminProductsPage"
import { AdminUsersPage } from "./pages/admin/AdminUsersPage"
import { CartPage } from "./pages/CartPage"
import { CheckoutPage } from "./pages/CheckoutPage"
import { CategoriesPage } from "./pages/CategoriesPage"
import { CategoryProductsPage } from "./pages/CategoryProductsPage"
import { CollectionsPage } from "./pages/CollectionsPage"
import { JournalPage } from "./pages/JournalPage"
import { JournalPostPage } from "./pages/JournalPostPage"
import { HomePage } from "./pages/HomePage"
import { LoginPage } from "./pages/LoginPage"
import { NotFoundPage } from "./pages/NotFoundPage"
import { NotificationsPage } from "./pages/NotificationsPage"
import { OrderDetailPage } from "./pages/OrderDetailPage"
import { OrdersPage } from "./pages/OrdersPage"
import { ProductDetailsPage } from "./pages/ProductDetailsPage"
import { ProductsPage } from "./pages/ProductsPage"
import { ProfilePage } from "./pages/ProfilePage"
import { RegisterPage } from "./pages/RegisterPage"
import { fadeUp } from "./lib/motion"
import { useAuth } from "./types/auth-context"

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `aurelia-nav-link${isActive ? " aurelia-nav-link-active" : ""}`

const Shell = () => {
  useSocketLifecycle()
  const { user } = useAuth()
  const { itemCount } = useCart()
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
                <NavLink className={navLinkClass} to="/collections">
                  {t("shell.nav.collections")}
                </NavLink>
                <NavLink className={navLinkClass} to="/journal">
                  {t("shell.nav.journal")}
                </NavLink>
              </div>
              <LanguageToggle />
            </div>

            <Link className="aurelia-brand text-decoration-none text-center" to="/">
              ELABIZHU
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
              </span>
              <NavIconHint label={t("shell.search.label")}>
                <Link className="aurelia-icon-link text-decoration-none" to="/collections" aria-label={t("shell.search.label")}>
                  <FiSearch />
                </Link>
              </NavIconHint>
              <span className="aurelia-desktop-only">
                <UserMenu />
              </span>
              <NavIconHint label={t("shell.cart.label")}>
                <Link
                  className="aurelia-cart-icon text-decoration-none"
                  to="/cart"
                  aria-label={
                    itemCount > 0
                      ? t("shell.cart.labelWithCount", { count: itemCount })
                      : t("shell.cart.label")
                  }
                >
                  <FiShoppingBag />
                  {itemCount > 0 && (
                    <span className="aurelia-cart-badge">{itemCount > 99 ? "99+" : itemCount}</span>
                  )}
                </Link>
              </NavIconHint>
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
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/journal/:slug" element={<JournalPostPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:categoryId/products" element={<CategoryProductsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:productId" element={<ProductDetailsPage />} />

          <Route path="/cart" element={<CartPage />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/edit"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

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
