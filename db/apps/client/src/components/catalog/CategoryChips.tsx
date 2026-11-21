import { Link } from "react-router-dom"
import { useCategories } from "../../hooks/useCatalog"
import { useI18n } from "../../i18n"
import "../../styles/catalog.css"

type CategoryChipsProps = {
  /** Highlighted chip. Omit on the all-products page, where "All" is highlighted. */
  currentCategoryId?: string
}

/** Horizontal, snap-scrolling category chips for quick switching between categories. */
export const CategoryChips = ({ currentCategoryId }: CategoryChipsProps) => {
  const { t } = useI18n()
  const { data } = useCategories()

  const chipClass = (active: boolean) => (active ? "eb-cat-chip is-active" : "eb-cat-chip")

  return (
    <nav className="eb-cat-chips" aria-label={t("catalog.chips.label")}>
      <ul className="eb-cat-chips-track">
        <li>
          <Link
            to="/products"
            className={chipClass(!currentCategoryId)}
            aria-current={!currentCategoryId ? "page" : undefined}
          >
            {t("catalog.chips.all")}
          </Link>
        </li>
        {(data ?? []).map((category) => {
          const active = category.id === currentCategoryId
          return (
            <li key={category.id}>
              <Link
                to={`/categories/${category.id}/products`}
                className={chipClass(active)}
                aria-current={active ? "page" : undefined}
              >
                {category.name}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
