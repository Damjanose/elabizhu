import { useEffect, useRef, useState } from "react"
import { FiLogOut, FiPackage, FiUser } from "react-icons/fi"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../types/auth-context"

export const UserMenu = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
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

  if (!user) {
    return (
      <Link className="aurelia-icon-link text-decoration-none" to="/login" aria-label="Sign in">
        <FiUser />
      </Link>
    )
  }

  const onLogout = async () => {
    setSigningOut(true)
    try {
      await logout()
      setOpen(false)
      navigate("/")
    } finally {
      setSigningOut(false)
    }
  }

  const displayName = user.fullName?.trim() || user.email

  return (
    <div className="aurelia-user-menu" ref={containerRef}>
      <button
        type="button"
        className="aurelia-icon-link aurelia-user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${displayName}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <FiUser />
      </button>

      {open && (
        <div className="aurelia-user-menu-popover" role="menu" aria-label="Account menu">
          <div className="aurelia-user-menu-header">
            <span className="aurelia-user-menu-kicker">Signed In</span>
            <span className="aurelia-user-menu-name">{displayName}</span>
            <span className="aurelia-user-menu-email">{user.email}</span>
          </div>

          <div className="aurelia-user-menu-divider" aria-hidden />

          <Link
            to="/account"
            role="menuitem"
            className="aurelia-user-menu-item"
            onClick={() => setOpen(false)}
          >
            <FiUser aria-hidden="true" />
            <span>My Account</span>
          </Link>
          <Link
            to="/orders"
            role="menuitem"
            className="aurelia-user-menu-item"
            onClick={() => setOpen(false)}
          >
            <FiPackage aria-hidden="true" />
            <span>Orders</span>
          </Link>

          <div className="aurelia-user-menu-divider" aria-hidden />

          <button
            type="button"
            role="menuitem"
            className="aurelia-user-menu-item aurelia-user-menu-signout"
            onClick={onLogout}
            disabled={signingOut}
          >
            <FiLogOut aria-hidden="true" />
            <span>{signingOut ? "Signing Out…" : "Sign Out"}</span>
          </button>
        </div>
      )}
    </div>
  )
}
