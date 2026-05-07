import { Link } from "react-router-dom"
import type { Product } from "@jewellery/types"
import { deriveDisplayBadge } from "../../utils/productBadges"
import { BadgePill } from "./BadgePill"

export const ProductCard = ({ product }: { product: Product }) => {
  const badge = deriveDisplayBadge(product)
  const thumb = product.images[0]?.url ?? "https://placehold.co/400x400?text=Jewellery"
  return (
    <div className="aurelia-product-card h-100">
      <Link to={`/products/${product.id}`} className="ratio ratio-1x1 text-decoration-none">
        <img src={thumb} alt="" className="object-fit-cover w-100 h-100 aurelia-product-image" />
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
    </div>
  )
}
