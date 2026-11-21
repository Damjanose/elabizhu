import { motion } from "motion/react"
import { ProductCatalog } from "../components/catalog/ProductCatalog"
import { useI18n } from "../i18n"
import { fadeUp, scrollRevealViewport } from "../lib/motion"

export const CollectionsPage = () => {
  const { t } = useI18n()

  return (
    <motion.section className="py-12 md:py-16" variants={fadeUp} initial="hidden" animate="visible">
      <header className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
        <span className="aurelia-admin-kicker mb-3 d-inline-block">{t("catalog.collections.kicker")}</span>
        <h1 className="font-display-xl text-headline-lg font-normal mb-4 mt-2">{t("catalog.collections.title")}</h1>
        <p className="aurelia-muted mb-0">{t("catalog.collections.copy")}</p>
      </header>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={scrollRevealViewport}
      >
        <ProductCatalog featuredOnly={false} />
      </motion.div>
    </motion.section>
  )
}
