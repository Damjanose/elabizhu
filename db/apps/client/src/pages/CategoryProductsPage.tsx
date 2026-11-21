import { useQuery } from "@tanstack/react-query"
import type { Category, Product } from "@jewellery/types"
import { motion } from "motion/react"
import { useParams } from "react-router-dom"
import { ProductCard } from "../components/product/ProductCard"
import { EmptyState } from "../components/feedback/EmptyState"
import { useQueryLoadState } from "../hooks/useQueryLoadState"
import { useI18n } from "../i18n"
import { apiClient } from "../api/client"
import { queryKeys } from "../lib/query-keys"
import { queryTiming } from "../lib/query-client"
import { fadeUp, listItem, listStagger, scrollRevealViewport } from "../lib/motion"

export const CategoryProductsPage = () => {
  const { categoryId = "" } = useParams()
  const { t } = useI18n()

  const productsQuery = useQuery({
    queryKey: queryKeys.category.products(categoryId),
    queryFn: async () => {
      const { data: d } = await apiClient.get<Product[]>(`/categories/${categoryId}/products`)
      return d
    },
    enabled: !!categoryId,
    staleTime: queryTiming.catalogueStaleTime,
  })

  const categoryQuery = useQuery({
    queryKey: queryKeys.category.detail(categoryId),
    queryFn: async () => {
      const { data: d } = await apiClient.get<Category>(`/categories/${categoryId}`)
      return d
    },
    enabled: !!categoryId,
    staleTime: queryTiming.catalogueStaleTime,
  })
  const { showSkeleton: showProductsSkeleton } = useQueryLoadState(productsQuery)

  const heading = categoryQuery.data?.name ?? t("catalog.category.fallbackTitle")

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <motion.h1
        className="h3 fw-bold mb-3"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={scrollRevealViewport}
      >
        {heading}
      </motion.h1>

      {showProductsSkeleton ? (
        <CategoryProductsSkeleton />
      ) : productsQuery.isError ? (
        <EmptyState
          variant="card"
          tone="danger"
          icon="error"
          kicker={t("catalog.error.kicker")}
          title={t("catalog.error.categoryTitle")}
          copy={t("catalog.error.copy")}
          cta={{
            label: productsQuery.isFetching ? t("catalog.action.retrying") : t("catalog.action.tryAgain"),
            onClick: () => void productsQuery.refetch(),
          }}
          secondaryCta={{ to: "/categories", label: t("catalog.action.browseCategories") }}
        />
      ) : !productsQuery.data || productsQuery.data.length === 0 ? (
        <EmptyState
          variant="card"
          icon="diamond"
          kicker={(categoryQuery.data?.name ?? t("catalog.categories.collection")).toUpperCase()}
          title={t("catalog.category.emptyTitle")}
          copy={t("catalog.category.emptyCopy")}
          cta={{ to: "/categories", label: t("catalog.action.browseCategories") }}
          secondaryCta={{ to: "/products", label: t("catalog.action.viewAllProducts") }}
        />
      ) : (
        <motion.div className="row g-3" variants={listStagger} initial="hidden" animate="visible">
          {productsQuery.data.map((product) => (
            <motion.div key={product.id} className="col-6 col-lg-4 col-xl-3" variants={listItem}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}

const CategoryProductsSkeleton = () => (
  <div className="row g-3" aria-busy="true" aria-live="polite">
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
      <div key={i} className="col-6 col-lg-4 col-xl-3">
        <div className="aurelia-product-skeleton" />
      </div>
    ))}
  </div>
)
