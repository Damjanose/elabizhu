import { useQuery } from "@tanstack/react-query"
import type { Product } from "@jewellery/types"
import { motion } from "motion/react"
import { ProductCard } from "../product/ProductCard"
import { EmptyState } from "../feedback/EmptyState"
import { useQueryLoadState } from "../../hooks/useQueryLoadState"
import { listItem, listStagger, shouldReduceMotion } from "../../lib/motion"
import { queryKeys } from "../../lib/query-keys"
import { queryTiming } from "../../lib/query-client"
import { fetchProducts } from "../../services/products"
import { useI18n } from "../../i18n"
import "../../styles/catalog.css"

type ProductCatalogProps = {
  featuredOnly: boolean
  /** When featured-only grid is empty, primary CTA target (catalog) */
  viewAllHref?: string
}

/** Shared query for the store-wide product list (also used by the products page). */
export const useCatalogProductsQuery = (featuredOnly: boolean) =>
  useQuery({
    queryKey: queryKeys.products.list({ featuredOnly }),
    queryFn: () => fetchProducts({ featured: featuredOnly || undefined }),
    staleTime: queryTiming.catalogueStaleTime,
  })

export const ProductCatalog = ({ featuredOnly, viewAllHref = "/collections" }: ProductCatalogProps) => {
  const { t } = useI18n()
  const productsQuery = useCatalogProductsQuery(featuredOnly)
  const { data, isError, refetch, isFetching } = productsQuery
  const { showSkeleton } = useQueryLoadState(productsQuery)

  if (showSkeleton) {
    return <CatalogGridSkeleton />
  }

  if (isError) {
    return (
      <EmptyState
        variant="card"
        tone="danger"
        icon="error"
        kicker={t("catalog.error.kicker")}
        title={t("catalog.error.catalogueTitle")}
        copy={t("catalog.error.copy")}
        cta={{
          label: isFetching ? t("catalog.action.retrying") : t("catalog.action.tryAgain"),
          onClick: () => void refetch(),
        }}
        secondaryCta={{ to: "/", label: t("catalog.action.returnHome") }}
      />
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        variant="card"
        icon="auto_awesome"
        kicker={featuredOnly ? t("catalog.empty.featuredKicker") : t("catalog.empty.catalogueKicker")}
        title={featuredOnly ? t("catalog.empty.featuredTitle") : t("catalog.empty.allTitle")}
        copy={featuredOnly ? t("catalog.empty.featuredCopy") : t("catalog.empty.allCopy")}
        cta={featuredOnly ? { to: viewAllHref, label: t("catalog.action.viewAllProducts") } : undefined}
        secondaryCta={{ to: "/categories", label: t("catalog.action.shopByCategory") }}
      />
    )
  }

  return <CatalogGrid products={data} />
}

/** 2 columns on mobile, 3 from 768px, 4 from 1200px. Stagger reveal unless reduced motion is requested. */
export const CatalogGrid = ({ products }: { products: Product[] }) => {
  const reduce = shouldReduceMotion()
  return (
    <motion.ul
      className="eb-cat-grid"
      variants={listStagger}
      initial={reduce ? false : "hidden"}
      animate="visible"
    >
      {products.map((product) => (
        <motion.li key={product.id} className="eb-cat-grid-item" variants={listItem}>
          <ProductCard product={product} />
        </motion.li>
      ))}
    </motion.ul>
  )
}

/** Same grid geometry as CatalogGrid so the page does not shift when data arrives. */
export const CatalogGridSkeleton = () => {
  const { t } = useI18n()
  return (
    <ul className="eb-cat-grid" aria-busy="true" aria-live="polite" aria-label={t("catalog.products.loading")}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <li key={i} className="eb-cat-grid-item" aria-hidden>
          <span className="eb-cat-skel-media eb-cat-shimmer" />
          <span className="eb-cat-skel-meta">
            <span className="eb-cat-skel-bar" style={{ width: "70%" }} />
            <span className="eb-cat-skel-bar" style={{ width: "35%" }} />
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Shown when the loaded products exist but the current toolbar filters hide all of them. */
export const CatalogFilteredEmpty = ({ onReset }: { onReset: () => void }) => {
  const { t } = useI18n()
  return (
    <div className="eb-cat-empty" role="status">
      <h2 className="eb-cat-empty-title">{t("catalog.filters.emptyTitle")}</h2>
      <p className="eb-cat-empty-copy">{t("catalog.filters.emptyCopy")}</p>
      <button type="button" className="eb-cat-pill eb-cat-pill--outline" onClick={onReset}>
        {t("catalog.filters.reset")}
      </button>
    </div>
  )
}
