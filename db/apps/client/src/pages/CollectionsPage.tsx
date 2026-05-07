import { motion } from "motion/react"
import { ProductCatalog } from "../components/catalog/ProductCatalog"
import { fadeUp, scrollRevealViewport } from "../lib/motion"

export const CollectionsPage = () => (
  <motion.section className="py-12 md:py-16" variants={fadeUp} initial="hidden" animate="visible">
    <header className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
      <span className="aurelia-admin-kicker mb-3 d-inline-block">The Atelier</span>
      <h1 className="font-display-xl text-headline-lg font-normal mb-4 mt-2">Collections</h1>
      <p className="aurelia-muted mb-0">
        Discover every piece currently in our catalogue—hand-finished, ready to love, and made to last.
      </p>
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
