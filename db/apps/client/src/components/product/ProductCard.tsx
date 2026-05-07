import { motion } from "motion/react"
import { Link } from "react-router-dom"
import type { Product } from "@jewellery/types"
import { deriveDisplayBadge } from "../../utils/productBadges"
import { transition } from "../../lib/motion"
import { BadgePill } from "./BadgePill"

export const ProductCard = ({ product, eagerImage = false }: { product: Product; eagerImage?: boolean }) => {
  const badge = deriveDisplayBadge(product)
  const thumb = product.images[0]?.url ?? "https://placehold.co/400x400?text=Jewellery"
  return (
    <motion.div
      className="aurelia-product-card h-100"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={transition.base}
    >
      <Link
        to={`/products/${product.id}`}
        className="ratio ratio-1x1 text-decoration-none overflow-hidden rounded-0"
      >
        <motion.img
          src={thumb}
          alt=""
          className="object-fit-cover w-100 h-100 aurelia-product-image"
          loading={eagerImage ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eagerImage ? "high" : "auto"}
          whileHover={{ scale: 1.06 }}
          transition={transition.slow}
        />
      </Link>
      <div className="pt-3 d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <Link to={`/products/${product.id}`} className="aurelia-product-name text-decoration-none">
            {product.name}
          </Link>
          {badge && <BadgePill badge={badge} />}
        </div>
        <p className="aurelia-muted small flex-grow-1 text-truncate">{product.description ?? ""}</p>
        <div className="d-flex justify-content-between align-items-center mt-2">
          <span className="aurelia-product-price">${Number(product.price).toFixed(2)}</span>
          {product.featured && <span className="aurelia-featured-badge">Featured</span>}
        </div>
      </div>
    </motion.div>
  )
}
