import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { ProductCard } from "../product/ProductCard"
import { EmptyState } from "../feedback/EmptyState"
import { useQueryLoadState } from "../../hooks/useQueryLoadState"
import { listItem, listStagger } from "../../lib/motion"
import { queryKeys } from "../../lib/query-keys"
import { queryTiming } from "../../lib/query-client"
import { fetchProducts } from "../../services/products"

type ProductCatalogProps = {
  featuredOnly: boolean
  /** When featured-only grid is empty, primary CTA target (catalog) */
  viewAllHref?: string
}

export const ProductCatalog = ({ featuredOnly, viewAllHref = "/collections" }: ProductCatalogProps) => {
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
        kicker="Connection Issue"
        title="We couldn’t load the catalogue"
        copy="An unexpected issue interrupted our request. Please try again."
        cta={{ label: isFetching ? "Retrying…" : "Try Again", onClick: () => void refetch() }}
        secondaryCta={{ to: "/", label: "Return Home" }}
      />
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        variant="card"
        icon="auto_awesome"
        kicker={featuredOnly ? "Featured Pieces" : "Atelier Catalogue"}
        title={featuredOnly ? "No featured pieces just now" : "No pieces available yet"}
        copy={
          featuredOnly
            ? "Our editors are curating the next selection. Explore the full collection in the meantime."
            : "Our artisans are crafting the next collection. Check back soon."
        }
        cta={featuredOnly ? { to: viewAllHref, label: "View All Products" } : undefined}
        secondaryCta={{ to: "/categories", label: "Shop by Category" }}
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
