import { motion } from "motion/react"
import { useSearchParams } from "react-router-dom"
import { ProductCatalog } from "../components/catalog/ProductCatalog"
import { useI18n } from "../i18n"
import { fadeUp, scrollRevealViewport } from "../lib/motion"

export const ProductsPage = () => {
  const [params] = useSearchParams()
  const featuredOnly = params.get("featured") === "1"
  const { t } = useI18n()

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <motion.h1
        className="h3 fw-bold mb-3"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={scrollRevealViewport}
      >
        {featuredOnly ? t("catalog.products.featuredTitle") : t("catalog.products.allTitle")}
      </motion.h1>

      <ProductCatalog featuredOnly={featuredOnly} />
    </motion.div>
  )
}
