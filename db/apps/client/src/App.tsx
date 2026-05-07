import { Link, Route, Routes } from "react-router-dom"
import { FiSearch, FiShoppingBag } from "react-icons/fi"
import { ErrorBoundary } from "./components/feedback/ErrorBoundary"
import { GuestRoute } from "./components/GuestRoute"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { StaffRoute } from "./components/StaffRoute"
import { UserMenu } from "./components/auth/UserMenu"
import { useCart } from "./hooks/useCart"
import { useSocketLifecycle } from "./hooks/useSocketLifecycle"
import { AccountPage } from "./pages/AccountPage"
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage"
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage"
import { AdminProductsPage } from "./pages/admin/AdminProductsPage"
import { CartPage } from "./pages/CartPage"
import { CategoriesPage } from "./pages/CategoriesPage"
import { CategoryProductsPage } from "./pages/CategoryProductsPage"
import { CheckoutPage } from "./pages/CheckoutPage"
import { HomePage } from "./pages/HomePage"
import { LoginPage } from "./pages/LoginPage"
import { NotFoundPage } from "./pages/NotFoundPage"
import { NotificationsPage } from "./pages/NotificationsPage"
import { OrderDetailPage } from "./pages/OrderDetailPage"
import { OrdersPage } from "./pages/OrdersPage"
import { ProductDetailsPage } from "./pages/ProductDetailsPage"
import { ProductsPage } from "./pages/ProductsPage"
import { RegisterPage } from "./pages/RegisterPage"

const Shell = () => {
  useSocketLifecycle()
  const { itemCount } = useCart()

  return (
    <div className="aurelia-app-shell min-vh-100">
      <nav className="aurelia-topbar sticky-top">
        <div className="aurelia-container aurelia-nav-grid">
          <div className="aurelia-nav-left">
            <Link className="aurelia-nav-link" to="/products">
              Collections
            </Link>
            <Link className="aurelia-nav-link" to="/categories">
              Story
            </Link>
            <Link className="aurelia-nav-link" to="/account">
              Bespoke
            </Link>
            <Link className="aurelia-nav-link" to="/products">
              Journal
            </Link>
          </div>

          <Link className="aurelia-brand text-decoration-none text-center" to="/">
            AURELIA
          </Link>

          <div className="aurelia-nav-right">
            <Link className="aurelia-icon-link text-decoration-none" to="/products" aria-label="Search">
              <FiSearch />
            </Link>
            <UserMenu />
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
          </div>
        </div>
      </nav>
      <main className="aurelia-container py-4 py-md-5">
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
              <StaffRoute>
                <AdminDashboardPage />
              </StaffRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <StaffRoute>
                <AdminProductsPage />
              </StaffRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <StaffRoute>
                <AdminOrdersPage />
              </StaffRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </ErrorBoundary>
      </main>
    </div>
  )
}

export const App = () => <Shell />
