import { Link, Navigate, Route, Routes } from "react-router-dom"
import { FiSearch, FiShoppingBag } from "react-icons/fi"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { StaffRoute } from "./components/StaffRoute"
import { UserMenu } from "./components/auth/UserMenu"
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
import { NotificationsPage } from "./pages/NotificationsPage"
import { OrderDetailPage } from "./pages/OrderDetailPage"
import { OrdersPage } from "./pages/OrdersPage"
import { ProductDetailsPage } from "./pages/ProductDetailsPage"
import { ProductsPage } from "./pages/ProductsPage"
import { RegisterPage } from "./pages/RegisterPage"
import { useAuth } from "./types/auth-context"

const Shell = () => {
  useSocketLifecycle()
  const { user } = useAuth()

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
            <Link className="aurelia-cart-icon text-decoration-none" to={user ? "/cart" : "/login"} aria-label="Cart">
              <FiShoppingBag />
              <span className="aurelia-cart-badge">{user ? "1" : "0"}</span>
            </Link>
          </div>
        </div>
      </nav>
      <main className="aurelia-container py-4 py-md-5">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:categoryId/products" element={<CategoryProductsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:productId" element={<ProductDetailsPage />} />

          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export const App = () => <Shell />
