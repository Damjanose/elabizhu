import { motion } from "motion/react"
import { useSearchParams } from "react-router-dom"
import { ProductCatalog } from "../components/catalog/ProductCatalog"
import { fadeUp, scrollRevealViewport } from "../lib/motion"

export const ProductsPage = () => {
  const [params] = useSearchParams()
  const featuredOnly = params.get("featured") === "1"

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

      <ProductCatalog featuredOnly={featuredOnly} />
    </motion.div>
  )
}
