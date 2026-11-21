import { useEffect, useRef, useState } from "react"
import { FiGrid, FiLogOut, FiPackage, FiUser } from "react-icons/fi"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../types/auth-context"
import { NavIconHint } from "../nav/NavIconHint"
import { loginHrefWithReturn } from "../../utils/post-auth-redirect"
import { infoToast, toastFromError } from "../../utils/toast"
import { useI18n } from "../../i18n"

export const UserMenu = () => {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const signInHref = loginHrefWithReturn(location)
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
      <NavIconHint label={t("shell.signIn.label")}>
        <Link className="aurelia-icon-link text-decoration-none" to={signInHref} aria-label={t("shell.signIn.label")}>
          <FiUser />
        </Link>
      </NavIconHint>
    )
  }

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

  const displayName = user.fullName?.trim() || user.email

  return (
    <div className="aurelia-user-menu" ref={containerRef}>
      <NavIconHint label={t("shell.account.hint")}>
        <button
          type="button"
          className="aurelia-icon-link aurelia-user-menu-trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t("shell.account.menuAria", { name: displayName })}
          onClick={() => setOpen((prev) => !prev)}
        >
          <FiUser />
        </button>
      </NavIconHint>

      {open && (
        <div className="aurelia-user-menu-popover" role="menu" aria-label={t("shell.account.menuLabel")}>
          <div className="aurelia-user-menu-header">
            <span className="aurelia-user-menu-kicker">{t("shell.account.signedIn")}</span>
            <span className="aurelia-user-menu-name">{displayName}</span>
            <span className="aurelia-user-menu-email">{user.email}</span>
          </div>

          <div className="aurelia-user-menu-divider" aria-hidden />

          {(user.permissions.includes("admin") || user.permissions.includes("administrator")) && (
            <Link
              to="/admin"
              role="menuitem"
              className="aurelia-user-menu-item"
              onClick={() => setOpen(false)}
            >
              <FiGrid aria-hidden="true" />
              <span>{t("shell.account.adminDashboard")}</span>
            </Link>
          )}
          <Link
            to="/account"
            role="menuitem"
            className="aurelia-user-menu-item"
            onClick={() => setOpen(false)}
          >
            <FiUser aria-hidden="true" />
            <span>{t("shell.account.myAccount")}</span>
          </Link>
          <Link
            to="/orders"
            role="menuitem"
            className="aurelia-user-menu-item"
            onClick={() => setOpen(false)}
          >
            <FiPackage aria-hidden="true" />
            <span>{t("shell.account.orders")}</span>
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
            <span>{signingOut ? t("shell.account.signingOut") : t("shell.account.signOut")}</span>
          </button>
        </div>
      )}
    </div>
  )
}
