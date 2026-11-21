import { motion } from "motion/react"
import { Link } from "react-router-dom"
import type { Product } from "@jewellery/types"
import { useI18n } from "../../i18n"
import { deriveDisplayBadge } from "../../utils/productBadges"
import { transition } from "../../lib/motion"
import { BadgePill } from "./BadgePill"

export const ProductCard = ({ product, eagerImage = false }: { product: Product; eagerImage?: boolean }) => {
  const { t } = useI18n()
  const badge = deriveDisplayBadge(product)
  const thumb = product.images[0]?.url
  const detailsPath = `/products/${product.id}`
  return (
    <motion.article
      className="eb-home-product"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={transition.base}
    >
      <Link to={detailsPath} className="eb-home-media eb-home-product-media">
        {thumb ? (
          <motion.img
            src={thumb}
            alt={product.name}
            className="eb-home-product-img"
            loading={eagerImage ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={eagerImage ? "high" : "auto"}
            whileHover={{ scale: 1.04 }}
            transition={transition.slow}
          />
        ) : (
          <span className="eb-home-shimmer eb-home-product-img" aria-hidden>
            <span className="eb-home-placeholder-label">{t("home.product.placeholder")}</span>
          </span>
        )}
      </Link>
      <div className="eb-home-product-meta">
        {(badge || product.featured) && (
          <div className="eb-home-product-tags">
            {badge && <BadgePill badge={badge} />}
            {product.featured && <span className="eb-home-tag">{t("home.featured.tag")}</span>}
          </div>
        )}
        <Link to={detailsPath} className="eb-home-product-name">
          {product.name}
        </Link>
        {product.description && <p className="eb-home-product-desc">{product.description}</p>}
        <span className="eb-home-product-price">{`$${Number(product.price).toFixed(2)}`}</span>
      </div>
    </motion.article>
  )
}
