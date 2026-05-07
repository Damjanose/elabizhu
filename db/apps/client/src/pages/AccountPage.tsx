import { useState } from "react"
import { FiLogOut } from "react-icons/fi"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../types/auth-context"

type AccountLink = {
  to: string
  title: string
  subtitle: string
}

const isStaff = (permissions: string[]) =>
  permissions.includes("admin") ||
  permissions.includes("product.write") ||
  permissions.includes("order.write")

export const AccountPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const onLogout = async () => {
    setSigningOut(true)
    try {
      await logout()
      navigate("/")
    } finally {
      setSigningOut(false)
    }
  }

  const displayName = user?.fullName?.trim() || user?.email || "Friend"
  const firstName = displayName.split(" ")[0]

  const baseLinks: AccountLink[] = [
    {
      to: "/orders",
      title: "Order History",
      subtitle: "Past purchases and shipment tracking.",
    },
    {
      to: "/notifications",
      title: "Notifications",
      subtitle: "Personal updates and curated communications.",
    },
    {
      to: "/categories",
      title: "Continue Browsing",
      subtitle: "Return to the curated collections.",
    },
  ]

  const links: AccountLink[] = user && isStaff(user.permissions)
    ? [
        ...baseLinks,
        {
          to: "/admin",
          title: "Atelier",
          subtitle: "Studio tools for products and orders.",
        },
      ]
    : baseLinks

  return (
    <section className="aurelia-account">
      <header className="aurelia-account-hero">
        <span className="aurelia-admin-kicker d-inline-block mb-3">The Aurelia Circle</span>
        <h1 className="aurelia-account-hero-title">Welcome, {firstName}.</h1>
        <p className="aurelia-account-hero-copy">
          Your private salon for orders, communications, and curated preferences.
        </p>
      </header>

      <div className="aurelia-account-grid">
        <aside className="aurelia-account-identity">
          <span className="aurelia-account-section-label">Identity</span>
          <dl className="aurelia-account-identity-list">
            <div>
              <dt>Name</dt>
              <dd>{user?.fullName || "—"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Membership</dt>
              <dd>Aurelia Circle</dd>
            </div>
          </dl>
        </aside>

        <div className="aurelia-account-links">
          <span className="aurelia-account-section-label">Quick Access</span>
          <nav aria-label="Account quick access">
            {links.map((link, index) => (
              <Link key={link.to} to={link.to} className="aurelia-account-link-row">
                <span className="aurelia-account-link-num">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="aurelia-account-link-meta">
                  <span className="aurelia-account-link-title">{link.title}</span>
                  <span className="aurelia-account-link-subtitle">{link.subtitle}</span>
                </span>
                <span className="aurelia-account-link-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="aurelia-account-signout-block">
        <div>
          <h2 className="aurelia-account-signout-title">End Session</h2>
          <p className="aurelia-account-signout-copy">
            Sign out securely from this device. You can return whenever you wish.
          </p>
        </div>
        <button
          type="button"
          className="aurelia-btn aurelia-btn-ghost-danger d-inline-flex align-items-center gap-2"
          onClick={onLogout}
          disabled={signingOut}
        >
          <FiLogOut aria-hidden="true" />
          {signingOut ? "Signing Out…" : "Sign Out"}
        </button>
      </div>
    </section>
  )
}
