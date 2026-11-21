import { FaTiktok } from "react-icons/fa"
import { FiGrid, FiHome, FiInstagram, FiShoppingBag } from "react-icons/fi"
import { NavLink } from "react-router-dom"
import { INSTAGRAM_URL, TIKTOK_URL } from "../../data/instagram"
import { useI18n } from "../../i18n"

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `aurelia-tab-bar-link${isActive ? " is-active" : ""}`

/** Fixed bottom navigation for small screens. Hidden on desktop via CSS. */
export const MobileTabBar = () => {
  const { t } = useI18n()

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
      <NavLink to="/products" className={tabClass}>
        <FiShoppingBag aria-hidden="true" />
        <span>{t("shell.tab.shop")}</span>
      </NavLink>
      <a className="aurelia-tab-bar-link" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
        <FiInstagram aria-hidden="true" />
        <span>{t("shell.tab.instagram")}</span>
      </a>
      <a className="aurelia-tab-bar-link" href={TIKTOK_URL} target="_blank" rel="noopener noreferrer">
        <FaTiktok aria-hidden="true" />
        <span>TikTok</span>
      </a>
    </nav>
  )
}
