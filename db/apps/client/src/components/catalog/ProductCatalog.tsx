import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { ProductCard } from "../product/ProductCard"
import { EmptyState } from "../feedback/EmptyState"
import { useQueryLoadState } from "../../hooks/useQueryLoadState"
import { listItem, listStagger } from "../../lib/motion"
import { queryKeys } from "../../lib/query-keys"
import { queryTiming } from "../../lib/query-client"
import { fetchProducts } from "../../services/products"
import { useI18n } from "../../i18n"

type ProductCatalogProps = {
  featuredOnly: boolean
  /** When featured-only grid is empty, primary CTA target (catalog) */
  viewAllHref?: string
}

export const ProductCatalog = ({ featuredOnly, viewAllHref = "/collections" }: ProductCatalogProps) => {
  const { t } = useI18n()
  const productsQuery = useQuery({
    queryKey: queryKeys.products.list({ featuredOnly }),
    queryFn: () => fetchProducts({ featured: featuredOnly || undefined }),
    staleTime: queryTiming.catalogueStaleTime,
  })
  const { data, isError, refetch, isFetching } = productsQuery
  const { showSkeleton } = useQueryLoadState(productsQuery)

  if (showSkeleton) {
    return <ProductsSkeleton />
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

  return (
    <motion.div className="row g-3" variants={listStagger} initial="hidden" animate="visible">
      {data.map((product) => (
        <motion.div key={product.id} className="col-6 col-lg-4 col-xl-3" variants={listItem}>
          <ProductCard product={product} />
        </motion.div>
      ))}
    </motion.div>
  )
}

const ProductsSkeleton = () => (
  <div className="row g-3" aria-busy="true" aria-live="polite">
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
      <div key={i} className="col-6 col-lg-4 col-xl-3">
        <div className="aurelia-product-skeleton" />
      </div>
    ))}
  </div>
)
