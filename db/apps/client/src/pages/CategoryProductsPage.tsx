import { useQuery } from "@tanstack/react-query"
import type { Category, Product } from "@jewellery/types"
import { motion } from "motion/react"
import { useParams } from "react-router-dom"
import { ProductCard } from "../components/product/ProductCard"
import { EmptyState } from "../components/feedback/EmptyState"
import { apiClient } from "../api/client"
import { fadeUp, listItem, listStagger, scrollRevealViewport } from "../lib/motion"

export const CategoryProductsPage = () => {
  const { categoryId = "" } = useParams()

  const productsQuery = useQuery({
    queryKey: ["categoryProducts", categoryId],
    queryFn: async () => {
      const { data: d } = await apiClient.get<Product[]>(`/categories/${categoryId}/products`)
      return d
    },
    enabled: !!categoryId,
  })

  const categoryQuery = useQuery({
    queryKey: ["category", categoryId],
    queryFn: async () => {
      const { data: d } = await apiClient.get<Category>(`/categories/${categoryId}`)
      return d
    },
    enabled: !!categoryId,
  })

  const heading = categoryQuery.data?.name ?? "Category products"

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

      {productsQuery.isLoading ? (
        <CategoryProductsSkeleton />
      ) : productsQuery.isError ? (
        <EmptyState
          variant="card"
          tone="danger"
          icon="error"
          kicker="Connection Issue"
          title="We couldn’t load this category"
          copy="An unexpected issue interrupted our request. Please try again."
          cta={{
            label: productsQuery.isFetching ? "Retrying…" : "Try Again",
            onClick: () => void productsQuery.refetch(),
          }}
          secondaryCta={{ to: "/categories", label: "Browse All Categories" }}
        />
      ) : !productsQuery.data || productsQuery.data.length === 0 ? (
        <EmptyState
          variant="card"
          icon="diamond"
          kicker={(categoryQuery.data?.name ?? "Collection").toUpperCase()}
          title="No pieces in this category yet"
          copy="Our artisans are still finishing the latest selection. Explore other collections in the meantime."
          cta={{ to: "/categories", label: "Browse All Categories" }}
          secondaryCta={{ to: "/products", label: "View All Products" }}
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
