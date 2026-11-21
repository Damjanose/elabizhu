import { FiGrid, FiHome, FiShoppingBag, FiUser } from "react-icons/fi"
import { NavLink } from "react-router-dom"
import { useCart } from "../../hooks/useCart"
import { useI18n } from "../../i18n"

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `aurelia-tab-bar-link${isActive ? " is-active" : ""}`

/** Fixed bottom navigation for small screens. Hidden on desktop via CSS. */
export const MobileTabBar = () => {
  const { t } = useI18n()
  const { itemCount } = useCart()

  return (
    <nav className="aurelia-tab-bar" aria-label={t("shell.tab.ariaLabel")}>
      <NavLink end to="/" className={tabClass}>
        <FiHome aria-hidden="true" />
        <span>{t("shell.tab.home")}</span>
      </NavLink>
      <NavLink to="/categories" className={tabClass}>
        <FiGrid aria-hidden="true" />
        <span>{t("shell.tab.categories")}</span>
      </NavLink>
      <NavLink
        to="/cart"
        className={tabClass}
        aria-label={itemCount > 0 ? t("shell.cart.labelWithCount", { count: itemCount }) : t("shell.cart.label")}
      >
        <span className="aurelia-tab-bar-icon">
          <FiShoppingBag aria-hidden="true" />
          {itemCount > 0 && (
            <span className="aurelia-cart-badge">{itemCount > 99 ? "99+" : itemCount}</span>
          )}
        </span>
        <span>{t("shell.tab.cart")}</span>
      </NavLink>
      <NavLink to="/account" className={tabClass}>
        <FiUser aria-hidden="true" />
        <span>{t("shell.tab.account")}</span>
      </NavLink>
    </nav>
  )
}
