import { useEffect, useRef, useState } from "react"
import { FiHome, FiLogOut, FiPackage, FiUser } from "react-icons/fi"
import { Link, useNavigate } from "react-router-dom"
import type { User } from "@jewellery/types"
import { useAuth } from "../../types/auth-context"
import { infoToast, toastFromError } from "../../utils/toast"

const staffSubtitle = (user: User) => {
  if (user.permissions.includes("admin") || user.permissions.includes("administrator")) {
    return "Administrator"
  }
  return "Operations"
}

export const AdminShellUserMenu = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const displayName = user?.fullName?.trim() || user?.email || "Admin User"
  const subtitle = user ? staffSubtitle(user) : "Operations"

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const onLogout = async () => {
    setSigningOut(true)
    try {
      await logout()
      setOpen(false)
      infoToast("You have been signed out")
      navigate("/")
    } catch (err) {
      toastFromError(err, "Could not sign you out")
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="aurelia-admin-shell-user-menu" ref={containerRef}>
      <button
        type="button"
        className="aurelia-admin-shell-user aurelia-admin-shell-user-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${displayName}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div>
          <p className="aurelia-admin-shell-user-kicker mb-0">Signed in</p>
          <p className="aurelia-admin-shell-user-display mb-0">{displayName}</p>
          <p className="aurelia-admin-shell-user-role mb-0">{subtitle}</p>
        </div>
        <span className="aurelia-admin-shell-user-avatar" aria-hidden>
          {displayName.charAt(0).toUpperCase()}
        </span>
      </button>

      {open && (
        <div
          className="aurelia-user-menu-popover aurelia-admin-shell-user-popover"
          role="menu"
          aria-label="Account menu"
        >
          <div className="aurelia-user-menu-header">
            <span className="aurelia-user-menu-kicker">Signed in</span>
            <span className="aurelia-user-menu-name">{displayName}</span>
            {user?.email && <span className="aurelia-user-menu-email">{user.email}</span>}
          </div>

          <div className="aurelia-user-menu-divider" aria-hidden />

          <Link
            to="/"
            role="menuitem"
            className="aurelia-user-menu-item"
            onClick={() => setOpen(false)}
          >
            <FiHome aria-hidden />
            <span>View storefront</span>
          </Link>
          <Link
            to="/account"
            role="menuitem"
            className="aurelia-user-menu-item"
            onClick={() => setOpen(false)}
          >
            <FiUser aria-hidden />
            <span>My account</span>
          </Link>
          <Link
            to="/orders"
            role="menuitem"
            className="aurelia-user-menu-item"
            onClick={() => setOpen(false)}
          >
            <FiPackage aria-hidden />
            <span>My orders</span>
          </Link>

          <div className="aurelia-user-menu-divider" aria-hidden />

          <button
            type="button"
            role="menuitem"
            className="aurelia-user-menu-item aurelia-user-menu-signout"
            onClick={() => void onLogout()}
            disabled={signingOut}
          >
            <FiLogOut aria-hidden />
            <span>{signingOut ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      )}
    </div>
  )
}
