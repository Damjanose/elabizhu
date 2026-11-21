import { useEffect, useRef, useState } from "react"
import { FiHome, FiLogOut, FiPackage, FiUser } from "react-icons/fi"
import { Link, useNavigate } from "react-router-dom"
import type { User } from "@jewellery/types"
import { useAuth } from "../../types/auth-context"
import { infoToast, toastFromError } from "../../utils/toast"
import { useI18n } from "../../i18n"

const staffSubtitle = (user: User, t: (key: string) => string) => {
  if (user.permissions.includes("admin") || user.permissions.includes("administrator")) {
    return t("shell.account.roleAdministrator")
  }
  return t("shell.account.roleOperations")
}

export const AdminShellUserMenu = () => {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const displayName = user?.fullName?.trim() || user?.email || t("shell.account.adminUser")
  const subtitle = user ? staffSubtitle(user, t) : t("shell.account.roleOperations")

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
      infoToast(t("shell.account.signedOutToast"))
      navigate("/")
    } catch (err) {
      toastFromError(err, t("shell.account.signOutError"))
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
        aria-label={t("shell.account.menuAria", { name: displayName })}
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
          aria-label={t("shell.account.menuLabel")}
        >
          <div className="aurelia-user-menu-header">
            <span className="aurelia-user-menu-kicker">{t("shell.account.signedIn")}</span>
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
            <span>{t("shell.account.viewStorefront")}</span>
          </Link>
          <Link
            to="/account"
            role="menuitem"
            className="aurelia-user-menu-item"
            onClick={() => setOpen(false)}
          >
            <FiUser aria-hidden />
            <span>{t("shell.account.myAccount")}</span>
          </Link>
          <Link
            to="/orders"
            role="menuitem"
            className="aurelia-user-menu-item"
            onClick={() => setOpen(false)}
          >
            <FiPackage aria-hidden />
            <span>{t("shell.account.myOrders")}</span>
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
            <span>{signingOut ? t("shell.account.signingOut") : t("shell.account.signOut")}</span>
          </button>
        </div>
      )}
    </div>
  )
}
