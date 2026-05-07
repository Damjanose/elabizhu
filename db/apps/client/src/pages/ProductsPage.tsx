import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { useSearchParams } from "react-router-dom"
import { ProductCard } from "../components/product/ProductCard"
import { EmptyState } from "../components/feedback/EmptyState"
import { fadeUp, listItem, listStagger, scrollRevealViewport } from "../lib/motion"
import { fetchProducts } from "../services/products"

export const ProductsPage = () => {
  const [params] = useSearchParams()
  const featuredOnly = params.get("featured") === "1"

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["products", { featuredOnly }],
    queryFn: () => fetchProducts({ featured: featuredOnly || undefined }),
  })

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <motion.h1
        className="h3 fw-bold mb-3"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={scrollRevealViewport}
      >
        {featuredOnly ? "Featured products" : "All products"}
      </motion.h1>

      {isLoading ? (
        <ProductsSkeleton />
      ) : isError ? (
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
      ) : !data || data.length === 0 ? (
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
          cta={featuredOnly ? { to: "/products", label: "View All Products" } : undefined}
          secondaryCta={{ to: "/categories", label: "Shop by Category" }}
        />
      ) : (
        <motion.div className="row g-3" variants={listStagger} initial="hidden" animate="visible">
          {data.map((product) => (
            <motion.div key={product.id} className="col-6 col-lg-4 col-xl-3" variants={listItem}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      )}
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
