import { motion } from "motion/react"
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom"
import { FiLayout, FiSearch, FiShoppingBag } from "react-icons/fi"
import { Slide, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { ErrorBoundary } from "./components/feedback/ErrorBoundary"
import { AdminRoute } from "./components/AdminRoute"
import { AdminShell } from "./components/admin/AdminShell"
import { GuestRoute } from "./components/GuestRoute"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { UserMenu } from "./components/auth/UserMenu"
import { NavIconHint } from "./components/nav/NavIconHint"
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
  const location = useLocation()
  const isAdminView = location.pathname.startsWith("/admin")
  const canAccessAdmin =
    user?.permissions.includes("admin") || user?.permissions.includes("administrator")

  return (
    <div className={`aurelia-app-shell min-vh-100${isAdminView ? " aurelia-app-shell--admin" : ""}`}>
      {!isAdminView && (
        <nav className="aurelia-topbar sticky-top">
          <div className="aurelia-container aurelia-nav-grid">
            <div className="aurelia-nav-left">
              <NavLink className={navLinkClass} to="/collections">
                Collections
              </NavLink>
              <NavLink className={navLinkClass} to="/categories">
                Story
              </NavLink>
              <NavLink className={navLinkClass} to="/account">
                Bespoke
              </NavLink>
              <NavLink className={navLinkClass} to="/journal">
                Journal
              </NavLink>
            </div>

            <Link className="aurelia-brand text-decoration-none text-center" to="/">
              ELABIZHU
            </Link>

            <div className="aurelia-nav-right">
              <NavIconHint label="Search">
                <Link className="aurelia-icon-link text-decoration-none" to="/collections" aria-label="Search">
                  <FiSearch />
                </Link>
              </NavIconHint>
              <UserMenu />
              <NavIconHint label="Cart">
                <Link
                  className="aurelia-cart-icon text-decoration-none"
                  to="/cart"
                  aria-label={itemCount > 0 ? `Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}` : "Cart"}
                >
                  <FiShoppingBag />
                  {itemCount > 0 && (
                    <span className="aurelia-cart-badge">{itemCount > 99 ? "99+" : itemCount}</span>
                  )}
                </Link>
              </NavIconHint>
              {canAccessAdmin && (
                <NavIconHint label="Dashboard">
                  <Link className="aurelia-icon-link text-decoration-none" to="/admin" aria-label="Admin dashboard">
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
