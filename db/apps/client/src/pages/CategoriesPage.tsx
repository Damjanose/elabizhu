import { motion } from "motion/react"
import { Link } from "react-router-dom"
import { MotionLink, linkPressProps } from "../components/motion/MotionLink"
import { useCategories } from "../hooks/useCatalog"
import { useQueryLoadState } from "../hooks/useQueryLoadState"
import { useI18n } from "../i18n"
import { listItem, listStagger, shouldReduceMotion } from "../lib/motion"
import "../styles/catalog.css"

const SKELETON_TILES = [0, 1, 2, 3]

export const CategoriesPage = () => {
  const { t } = useI18n()
  const categoriesQuery = useCategories()
  const { data, isError } = categoriesQuery
  const { showSkeleton } = useQueryLoadState(categoriesQuery)
  const reduce = shouldReduceMotion()
  const hasCategories = !showSkeleton && !isError && !!data && data.length > 0

  return (
    <div className="eb-cat-page">
      <header className="eb-cat-header">
        <p className="eb-cat-kicker">{t("catalog.categories.kicker")}</p>
        <h1 className="eb-cat-title">{t("catalog.categories.title")}</h1>
        <p className="eb-cat-intro">{t("catalog.categories.copy")}</p>
      </header>

      {showSkeleton && (
        <ul
          className="eb-cat-tiles"
          aria-busy="true"
          aria-live="polite"
          aria-label={t("catalog.categories.loading")}
        >
          {SKELETON_TILES.map((i) => (
            <li key={i} className="eb-cat-tile-item" aria-hidden>
              <span className="eb-cat-tile-media eb-cat-shimmer" />
              <span className="eb-cat-tile-text">
                <span className="eb-cat-skel-bar" style={{ width: "65%" }} />
                <span className="eb-cat-skel-bar" style={{ width: "30%" }} />
              </span>
            </li>
          ))}
        </ul>
      )}

      {isError && <p className="eb-cat-state">{t("catalog.categories.error")}</p>}

      {!showSkeleton && !isError && data && data.length === 0 && (
        <p className="eb-cat-state">{t("catalog.categories.empty")}</p>
      )}

      {hasCategories && (
        <motion.ul
          className={data.length === 5 ? "eb-cat-tiles eb-cat-tiles--five" : "eb-cat-tiles"}
          variants={listStagger}
          initial={reduce ? false : "hidden"}
          animate="visible"
        >
          {data.map((category) => (
            <motion.li key={category.id} className="eb-cat-tile-item" variants={listItem}>
              <Link
                to={`/categories/${category.id}/products`}
                className="eb-cat-tile"
                aria-label={t("catalog.categories.browse", { name: category.name })}
              >
                <span className="eb-cat-tile-media eb-cat-shimmer" aria-hidden />
                <span className="eb-cat-tile-text">
                  <span className="eb-cat-tile-name">{category.name}</span>
                  <span className="eb-cat-tile-cta">{t("catalog.categories.view")}</span>
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}

      <div className="eb-cat-more">
        <MotionLink to="/products" className="eb-cat-pill" {...linkPressProps}>
          {t("catalog.action.viewAllProducts")}
        </MotionLink>
      </div>
    </div>
  )
}
