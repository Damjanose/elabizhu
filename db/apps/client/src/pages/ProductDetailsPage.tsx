import { useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { Product } from "@jewellery/types"
import { Link, useParams } from "react-router-dom"
import { useCart } from "../hooks/useCart"
import { useCategories } from "../hooks/useCatalog"
import { fetchProduct, fetchProductRecommendations } from "../services/products"
import { useAuth } from "../types/auth-context"

const PLACEHOLDER_IMAGE = "https://placehold.co/800x1000?text=Aurelia"

const formatPrice = (value: string | number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))

export const ProductDetailsPage = () => {
  const { productId = "" } = useParams()
  const { user } = useAuth()
  const { addItem, isUpdating } = useCart()

  const productQuery = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
    enabled: !!productId,
  })

  const recommendationsQuery = useQuery({
    queryKey: ["product", productId, "recommendations"],
    queryFn: () => fetchProductRecommendations(productId, 8),
    enabled: !!productId,
  })

  const categoriesQuery = useCategories()

  const product = productQuery.data
  const categoryName = useMemo(() => {
    if (!product || !categoriesQuery.data) return null
    return (
      categoriesQuery.data.find((c) => c.id === product.categoryId)?.name ?? null
    )
  }, [product, categoriesQuery.data])

  if (productQuery.isLoading) {
    return (
      <section className="aurelia-pdp-shell">
        <div className="aurelia-pdp-state">Loading product…</div>
      </section>
    )
  }

  if (productQuery.isError || !product) {
    return (
      <section className="aurelia-pdp-shell">
        <div className="aurelia-pdp-state aurelia-pdp-state-error">
          We couldn’t find this piece. <Link to="/products">Browse the collection</Link>.
        </div>
      </section>
    )
  }

  return (
    <section className="aurelia-pdp-shell">
      <ProductHero
        product={product}
        categoryName={categoryName}
        canBuy={product.stockQuantity > 0}
        isUpdating={isUpdating}
        canAdd={!!user}
        onAdd={(quantity) => void addItem({ productId: product.id, quantity })}
      />
      <RecommendationsRail
        title="Recommended for You"
        items={recommendationsQuery.data ?? []}
        isLoading={recommendationsQuery.isLoading}
      />
    </section>
  )
}

type HeroProps = {
  product: Product
  categoryName: string | null
  canBuy: boolean
  canAdd: boolean
  isUpdating: boolean
  onAdd: (quantity: number) => void
}

const ProductHero = ({ product, categoryName, canBuy, canAdd, isUpdating, onAdd }: HeroProps) => {
  const images = product.images.length > 0 ? product.images : []
  const [activeIndex, setActiveIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const maxQty = Math.max(1, product.stockQuantity || 1)
  const activeImage = images[activeIndex]?.url ?? PLACEHOLDER_IMAGE

  const stockState = product.stockQuantity <= 0
    ? { label: "Out of stock", tone: "out-of-stock" as const }
    : product.stockQuantity <= product.lowStockThreshold
      ? { label: "Low stock — only a few remain", tone: "low-stock" as const }
      : { label: "In stock & ready to ship", tone: "in-stock" as const }

  const collectionLabel = (categoryName ?? "Aurelia").toUpperCase() + " COLLECTION"

  const handleAdd = () => {
    if (!canBuy || isUpdating || !canAdd) return
    onAdd(Math.min(quantity, maxQty))
  }

  const viewingMailto =
    `mailto:atelier@aurelia.com` +
    `?subject=${encodeURIComponent(`Private viewing — ${product.name}`)}` +
    `&body=${encodeURIComponent(
      `Hello Aurelia atelier,\n\nI’d like to book a private viewing for the “${product.name}”. Could you share availability over the next two weeks?\n\nThank you.`,
    )}`

  return (
    <div className="aurelia-pdp-grid">
      <div className="aurelia-pdp-gallery-col">
        <div className="aurelia-pdp-gallery">
          <div className="aurelia-pdp-thumbs" role="tablist" aria-label="Product images">
            {(images.length > 0 ? images : [{ id: "placeholder", url: PLACEHOLDER_IMAGE, sortOrder: 0 }]).map((img, i) => (
              <button
                key={img.id}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                className={`aurelia-pdp-thumb ${i === activeIndex ? "is-active" : ""}`}
                onClick={() => setActiveIndex(i)}
              >
                <img src={img.url} alt="" loading="lazy" />
              </button>
            ))}
          </div>
          <div className="aurelia-pdp-main-image">
            <img src={activeImage} alt={product.name} />
          </div>
        </div>
      </div>

      <div className="aurelia-pdp-info-col">
        <span className="aurelia-pdp-collection">{collectionLabel}</span>
        <h1 className="aurelia-pdp-title">{product.name}</h1>
        <div className="aurelia-pdp-price">{formatPrice(product.price)}</div>

        {product.description && (
          <p className="aurelia-pdp-description">{product.description}</p>
        )}

        <div className={`aurelia-pdp-stock ${stockState.tone}`}>
          <span className="aurelia-pdp-stock-dot" aria-hidden />
          <span>{stockState.label}</span>
        </div>

        <div className="aurelia-pdp-actions">
          <div className="aurelia-pdp-action-row">
            <div className="aurelia-pdp-qty" role="group" aria-label="Quantity">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <span className="material-symbols-outlined" aria-hidden>remove</span>
              </button>
              <span className="aurelia-pdp-qty-value" aria-live="polite">{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={quantity >= maxQty}
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              >
                <span className="material-symbols-outlined" aria-hidden>add</span>
              </button>
            </div>
            <button
              type="button"
              className="aurelia-pdp-add"
              disabled={!canBuy || isUpdating || !canAdd}
              onClick={handleAdd}
            >
              {!canBuy ? "Sold Out" : isUpdating ? "Adding…" : "Add to Cart"}
            </button>
          </div>
          <a className="aurelia-pdp-secondary" href={viewingMailto}>
            Book a Private Viewing
          </a>
          {!canAdd && (
            <p className="aurelia-pdp-signin">
              <Link to="/login">Sign in</Link> to add this piece to your cart.
            </p>
          )}
        </div>

        <div className="aurelia-pdp-accordion">
          <Accordion title="Materials & Specifications" defaultOpen>
            <dl className="aurelia-pdp-acc-rows">
              {categoryName && (
                <div className="aurelia-pdp-acc-row">
                  <span>Collection</span>
                  <span>{categoryName}</span>
                </div>
              )}
              <div className="aurelia-pdp-acc-row">
                <span>Reference</span>
                <span>{product.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="aurelia-pdp-acc-row">
                <span>Availability</span>
                <span>
                  {product.stockQuantity > 0
                    ? `${product.stockQuantity} ready to ship`
                    : "Made to order"}
                </span>
              </div>
              <div className="aurelia-pdp-acc-row">
                <span>Crafted</span>
                <span>London Atelier</span>
              </div>
            </dl>
          </Accordion>

          <Accordion title="Shipping & Returns">
            <p className="aurelia-pdp-acc-copy">
              Complimentary white-glove delivery, signature required. Pieces ship within
              two business days, presented in our signature lacquered case. Returns are
              accepted within 30 days of receipt for any unworn piece.
            </p>
          </Accordion>
        </div>
      </div>
    </div>
  )
}

type AccordionProps = {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

const Accordion = ({ title, defaultOpen = false, children }: AccordionProps) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`aurelia-pdp-acc-item ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="aurelia-pdp-acc-trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        <span className="material-symbols-outlined aurelia-pdp-acc-icon" aria-hidden>
          expand_more
        </span>
      </button>
      {open && <div className="aurelia-pdp-acc-body">{children}</div>}
    </div>
  )
}

const RecommendationsRail = ({
  title,
  items,
  isLoading,
}: {
  title: string
  items: Product[]
  isLoading: boolean
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null)

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector<HTMLElement>(".aurelia-rec-item")
    const distance = card ? card.getBoundingClientRect().width + 32 : track.clientWidth * 0.8
    track.scrollBy({ left: direction * distance, behavior: "smooth" })
  }

  return (
    <section className="aurelia-rec-section" aria-label={title}>
      <header className="aurelia-rec-header">
        <h2 className="aurelia-rec-title">{title}</h2>
        <div className="aurelia-rec-controls">
          <button
            type="button"
            className="aurelia-rec-arrow"
            aria-label="Scroll recommendations left"
            onClick={() => scrollBy(-1)}
            disabled={items.length === 0}
          >
            <span className="material-symbols-outlined" aria-hidden>west</span>
          </button>
          <button
            type="button"
            className="aurelia-rec-arrow"
            aria-label="Scroll recommendations right"
            onClick={() => scrollBy(1)}
            disabled={items.length === 0}
          >
            <span className="material-symbols-outlined" aria-hidden>east</span>
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="aurelia-rec-empty">Curating pieces just for you…</div>
      ) : items.length === 0 ? (
        <div className="aurelia-rec-empty">
          We’ll surface companion pieces here once more of the collection is in stock.
        </div>
      ) : (
        <div className="aurelia-rec-track" ref={trackRef}>
          {items.map((item) => {
            const thumb = item.images[0]?.url ?? PLACEHOLDER_IMAGE
            return (
              <Link
                key={item.id}
                to={`/products/${item.id}`}
                className="aurelia-rec-item"
              >
                <div className="aurelia-rec-image">
                  <img src={thumb} alt={item.name} loading="lazy" />
                </div>
                <h3 className="aurelia-rec-name">{item.name}</h3>
                <p className="aurelia-rec-price">{formatPrice(item.price)}</p>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
