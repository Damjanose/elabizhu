import { useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { Product } from "@jewellery/types"
import { AnimatePresence, motion } from "motion/react"
import { Link, useLocation, useParams } from "react-router-dom"
import { useCart } from "../hooks/useCart"
import { useCategories } from "../hooks/useCatalog"
import { fadeIn, fadeUp, listItem, listStagger, scrollRevealViewport, transition } from "../lib/motion"
import { fetchProduct, fetchProductRecommendations } from "../services/products"
import { loginHrefWithReturn } from "../utils/post-auth-redirect"
import { successToast, toastFromError } from "../utils/toast"

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
  const location = useLocation()
  const signInHref = loginHrefWithReturn(location)
  const { addItem, isUpdating, isGuest } = useCart()

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
    <motion.section className="aurelia-pdp-shell" variants={fadeUp} initial="hidden" animate="visible">
      <ProductHero
        product={product}
        categoryName={categoryName}
        signInHref={signInHref}
        canBuy={product.stockQuantity > 0}
        isUpdating={isUpdating}
        isGuest={isGuest}
        onAdd={async (quantity) => {
          try {
            await addItem({ product, quantity })
            successToast(
              quantity > 1
                ? `${quantity} × “${product.name}” added to cart`
                : `“${product.name}” added to cart`,
            )
          } catch (err) {
            toastFromError(err, "Could not add to cart")
          }
        }}
      />
      <RecommendationsRail
        title="Recommended for You"
        items={recommendationsQuery.data ?? []}
        isLoading={recommendationsQuery.isLoading}
      />
    </motion.section>
  )
}

type HeroProps = {
  product: Product
  categoryName: string | null
  signInHref: string
  canBuy: boolean
  isGuest: boolean
  isUpdating: boolean
  onAdd: (quantity: number) => void
}

const ProductHero = ({ product, categoryName, signInHref, canBuy, isGuest, isUpdating, onAdd }: HeroProps) => {
  const images = product.images.length > 0 ? product.images : []
  const [activeIndex, setActiveIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const maxQty = Math.max(1, product.stockQuantity || 1)
  const activeImage = images[activeIndex]?.url ?? PLACEHOLDER_IMAGE

  const stockState = product.stockQuantity <= 0
    ? { label: "Out of stock", tone: "out-of-stock" as const }
    : product.stockQuantity <= product.lowStockThreshold
      ? { label: "Low stock — only a few remain", tone: "low-stock" as const }
      : { label: "In stock & ready to ship", tone: "in-stock" as const }

  const collectionLabel = (categoryName ?? "Aurelia").toUpperCase() + " COLLECTION"

  const handleAdd = () => {
    if (!canBuy || isUpdating) return
    onAdd(Math.min(quantity, maxQty))
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 2200)
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
              <motion.button
                key={img.id}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                className={`aurelia-pdp-thumb ${i === activeIndex ? "is-active" : ""}`}
                onClick={() => setActiveIndex(i)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                transition={transition.quick}
              >
                <motion.img
                  src={img.url}
                  alt=""
                  loading="lazy"
                  whileHover={{ scale: 1.05 }}
                  transition={transition.quick}
                />
              </motion.button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeImage}
              className="aurelia-pdp-main-image"
              initial={{ opacity: 0.2, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1, transition: transition.base }}
              exit={{ opacity: 0, scale: 1.015, transition: transition.quick }}
            >
              <motion.img
                src={activeImage}
                alt={product.name}
                whileHover={{ scale: 1.02 }}
                transition={transition.slow}
              />
            </motion.div>
          </AnimatePresence>
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
              <motion.button
                type="button"
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                whileTap={quantity <= 1 ? undefined : { scale: 0.9 }}
                transition={transition.quick}
              >
                <span className="material-symbols-outlined" aria-hidden>remove</span>
              </motion.button>
              <span className="aurelia-pdp-qty-value" aria-live="polite">{quantity}</span>
              <motion.button
                type="button"
                aria-label="Increase quantity"
                disabled={quantity >= maxQty}
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                whileTap={quantity >= maxQty ? undefined : { scale: 0.9 }}
                transition={transition.quick}
              >
                <span className="material-symbols-outlined" aria-hidden>add</span>
              </motion.button>
            </div>
            <motion.button
              type="button"
              className="aurelia-pdp-add"
              disabled={!canBuy || isUpdating}
              onClick={handleAdd}
              whileHover={!canBuy || isUpdating ? undefined : { scale: 1.02, y: -1 }}
              whileTap={!canBuy || isUpdating ? undefined : { scale: 0.97 }}
              transition={transition.quick}
            >
              {!canBuy
                ? "Sold Out"
                : isUpdating
                  ? "Adding…"
                  : justAdded
                    ? "Added to Cart ✓"
                    : "Add to Cart"}
            </motion.button>
          </div>
          <a className="aurelia-pdp-secondary" href={viewingMailto}>
            Book a Private Viewing
          </a>
          {isGuest && (
            <p className="aurelia-pdp-signin">
              Shopping as a guest.{" "}
              <Link to={signInHref}>Sign in</Link> to sync your selection across
              devices and check out securely.
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
    <motion.div
      className={`aurelia-pdp-acc-item ${open ? "is-open" : ""}`}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={scrollRevealViewport}
    >
      <motion.button
        type="button"
        className="aurelia-pdp-acc-trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.99 }}
        transition={transition.quick}
      >
        <span>{title}</span>
        <span className="material-symbols-outlined aurelia-pdp-acc-icon" aria-hidden>
          expand_more
        </span>
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="aurelia-pdp-acc-body"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
    <motion.section
      className="aurelia-rec-section"
      aria-label={title}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={scrollRevealViewport}
    >
      <header className="aurelia-rec-header">
        <h2 className="aurelia-rec-title">{title}</h2>
        <div className="aurelia-rec-controls">
          <motion.button
            type="button"
            className="aurelia-rec-arrow"
            aria-label="Scroll recommendations left"
            onClick={() => scrollBy(-1)}
            disabled={items.length === 0}
            whileTap={items.length === 0 ? undefined : { scale: 0.92 }}
            transition={transition.quick}
          >
            <span className="material-symbols-outlined" aria-hidden>west</span>
          </motion.button>
          <motion.button
            type="button"
            className="aurelia-rec-arrow"
            aria-label="Scroll recommendations right"
            onClick={() => scrollBy(1)}
            disabled={items.length === 0}
            whileTap={items.length === 0 ? undefined : { scale: 0.92 }}
            transition={transition.quick}
          >
            <span className="material-symbols-outlined" aria-hidden>east</span>
          </motion.button>
        </div>
      </header>

      {isLoading ? (
        <div className="aurelia-rec-empty">Curating pieces just for you…</div>
      ) : items.length === 0 ? (
        <div className="aurelia-rec-empty">
          We’ll surface companion pieces here once more of the collection is in stock.
        </div>
      ) : (
        <motion.div
          className="aurelia-rec-track"
          ref={trackRef}
          variants={listStagger}
          initial="hidden"
          whileInView="visible"
          viewport={scrollRevealViewport}
        >
          {items.map((item) => {
            const thumb = item.images[0]?.url ?? PLACEHOLDER_IMAGE
            return (
              <motion.div key={item.id} variants={listItem}>
              <Link
                key={item.id}
                to={`/products/${item.id}`}
                className="aurelia-rec-item"
              >
                <div className="aurelia-rec-image overflow-hidden">
                  <motion.img
                    src={thumb}
                    alt={item.name}
                    loading="lazy"
                    whileHover={{ scale: 1.06 }}
                    transition={transition.slow}
                  />
                </div>
                <h3 className="aurelia-rec-name">{item.name}</h3>
                <p className="aurelia-rec-price">{formatPrice(item.price)}</p>
              </Link>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.section>
  )
}
