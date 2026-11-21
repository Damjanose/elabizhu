import { useMemo, useRef, useState } from "react"
import type { Product } from "@jewellery/types"
import { AnimatePresence, motion } from "motion/react"
import { Link, useLocation, useParams } from "react-router-dom"
import { useProductQuery, useProductRecommendationsQuery } from "../hooks/queries/useProductQueries"
import { useCart } from "../hooks/useCart"
import { useCategories } from "../hooks/useCatalog"
import { useQueryLoadState } from "../hooks/useQueryLoadState"
import { INSTAGRAM_URL } from "../data/instagram"
import { useI18n } from "../i18n"
import { fadeIn, fadeUp, listItem, listStagger, scrollRevealViewport, transition } from "../lib/motion"
import { loginHrefWithReturn } from "../utils/post-auth-redirect"
import { successToast, toastFromError } from "../utils/toast"

const PLACEHOLDER_IMAGE = "https://placehold.co/800x1000?text=ElaBizhu"

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
  const { t } = useI18n()

  const productQuery = useProductQuery(productId, !!productId)
  const recommendationsQuery = useProductRecommendationsQuery(productId, !!productId)
  const { showSkeleton: showProductSkeleton } = useQueryLoadState(productQuery)
  const { showSkeleton: showRecommendationsSkeleton } = useQueryLoadState(recommendationsQuery)

  const categoriesQuery = useCategories()

  const product = productQuery.data
  const categoryName = useMemo(() => {
    if (!product || !categoriesQuery.data) return null
    return (
      categoriesQuery.data.find((c) => c.id === product.categoryId)?.name ?? null
    )
  }, [product, categoriesQuery.data])

  if (showProductSkeleton) {
    return <ProductDetailsSkeleton />
  }

  if (productQuery.isError || !product) {
    return (
      <section className="aurelia-pdp-shell">
        <div className="aurelia-pdp-state aurelia-pdp-state-error">
          {t("catalog.pdp.notFound")} <Link to="/products">{t("catalog.pdp.browseLink")}</Link>.
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
                ? t("catalog.pdp.addedMany", { count: quantity, name: product.name })
                : t("catalog.pdp.addedOne", { name: product.name }),
            )
          } catch (err) {
            toastFromError(err, t("catalog.pdp.addFailed"))
          }
        }}
      />
      <RecommendationsRail
        title={t("catalog.pdp.recommended")}
        items={recommendationsQuery.data ?? []}
        showSkeleton={showRecommendationsSkeleton}
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
  const { t } = useI18n()
  const images = product.images.length > 0 ? product.images : []
  const [activeIndex, setActiveIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const maxQty = Math.max(1, product.stockQuantity || 1)
  const activeImage = images[activeIndex]?.url ?? PLACEHOLDER_IMAGE

  const stockState = product.stockQuantity <= 0
    ? { label: t("catalog.pdp.outOfStock"), tone: "out-of-stock" as const }
    : product.stockQuantity <= product.lowStockThreshold
      ? { label: t("catalog.pdp.lowStock"), tone: "low-stock" as const }
      : { label: t("catalog.pdp.inStock"), tone: "in-stock" as const }

  const collectionLabel = t("catalog.pdp.collection", { name: (categoryName ?? "ElaBizhu").toUpperCase() })

  const handleAdd = () => {
    if (!canBuy || isUpdating) return
    onAdd(Math.min(quantity, maxQty))
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 2200)
  }

  const viewingMailto =
    `mailto:atelier@aurelia.com` +
    `?subject=${encodeURIComponent(t("catalog.pdp.viewingSubject", { name: product.name }))}` +
    `&body=${encodeURIComponent(t("catalog.pdp.viewingBody", { name: product.name }))}`

  return (
    <div className="aurelia-pdp-grid">
      <div className="aurelia-pdp-gallery-col">
        <div className="aurelia-pdp-gallery">
          <div className="aurelia-pdp-thumbs" role="tablist" aria-label={t("catalog.pdp.thumbs")}>
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
            <div className="aurelia-pdp-qty" role="group" aria-label={t("catalog.pdp.quantity")}>
              <motion.button
                type="button"
                aria-label={t("catalog.pdp.decrease")}
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
                aria-label={t("catalog.pdp.increase")}
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
                ? t("catalog.pdp.soldOut")
                : isUpdating
                  ? t("catalog.pdp.adding")
                  : justAdded
                    ? t("catalog.pdp.added")
                    : t("catalog.pdp.addToCart")}
            </motion.button>
          </div>
          <a
            className="btn btn-outline-dark rounded-pill"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener"
          >
            {t("catalog.pdp.orderInstagram")}
          </a>
          <a className="aurelia-pdp-secondary" href={viewingMailto}>
            {t("catalog.pdp.viewing")}
          </a>
          {isGuest && (
            <p className="aurelia-pdp-signin">
              {t("catalog.pdp.guestLead")}{" "}
              <Link to={signInHref}>{t("catalog.pdp.signIn")}</Link> {t("catalog.pdp.guestTail")}
            </p>
          )}
        </div>

        <div className="aurelia-pdp-accordion">
          <Accordion title={t("catalog.pdp.specs")} defaultOpen>
            <dl className="aurelia-pdp-acc-rows">
              {categoryName && (
                <div className="aurelia-pdp-acc-row">
                  <span>{t("catalog.pdp.rowCollection")}</span>
                  <span>{categoryName}</span>
                </div>
              )}
              <div className="aurelia-pdp-acc-row">
                <span>{t("catalog.pdp.rowReference")}</span>
                <span>{product.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="aurelia-pdp-acc-row">
                <span>{t("catalog.pdp.rowAvailability")}</span>
                <span>
                  {product.stockQuantity > 0
                    ? t("catalog.pdp.readyToShip", { count: product.stockQuantity })
                    : t("catalog.pdp.madeToOrder")}
                </span>
              </div>
              <div className="aurelia-pdp-acc-row">
                <span>{t("catalog.pdp.rowCrafted")}</span>
                <span>{t("catalog.pdp.craftedAt")}</span>
              </div>
            </dl>
          </Accordion>

          <Accordion title={t("catalog.pdp.shipping")}>
            <p className="aurelia-pdp-acc-copy">
              {t("catalog.pdp.shippingCopy")}
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
  showSkeleton,
}: {
  title: string
  items: Product[]
  showSkeleton: boolean
}) => {
  const { t } = useI18n()
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
            aria-label={t("catalog.pdp.scrollLeft")}
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
            aria-label={t("catalog.pdp.scrollRight")}
            onClick={() => scrollBy(1)}
            disabled={items.length === 0}
            whileTap={items.length === 0 ? undefined : { scale: 0.92 }}
            transition={transition.quick}
          >
            <span className="material-symbols-outlined" aria-hidden>east</span>
          </motion.button>
        </div>
      </header>

      {showSkeleton ? (
        <RecommendationsRailSkeleton />
      ) : items.length === 0 ? (
        <div className="aurelia-rec-empty">
          {t("catalog.pdp.recEmpty")}
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

const ProductDetailsSkeleton = () => {
  const { t } = useI18n()
  return (
    <section className="aurelia-pdp-shell" aria-busy="true" aria-live="polite" aria-label={t("catalog.pdp.loadingProduct")}>
      <div className="aurelia-pdp-grid">
        <div className="aurelia-pdp-gallery-col">
          <div className="aurelia-pdp-gallery">
            <div className="aurelia-pdp-thumbs" aria-hidden>
              {[0, 1, 2].map((index) => (
                <div key={index} className="aurelia-pdp-skeleton-thumb aurelia-shimmer-block" />
              ))}
            </div>
            <div className="aurelia-pdp-skeleton-main aurelia-shimmer-block" aria-hidden />
          </div>
        </div>

        <div className="aurelia-pdp-info-col" aria-hidden>
          <div className="aurelia-pdp-skeleton-line aurelia-pdp-skeleton-line--kicker aurelia-shimmer-block" />
          <div className="aurelia-pdp-skeleton-line aurelia-pdp-skeleton-line--title aurelia-shimmer-block" />
          <div className="aurelia-pdp-skeleton-line aurelia-pdp-skeleton-line--price aurelia-shimmer-block" />
          <div className="aurelia-pdp-skeleton-line aurelia-pdp-skeleton-line--copy aurelia-shimmer-block" />
          <div className="aurelia-pdp-skeleton-line aurelia-pdp-skeleton-line--copy aurelia-shimmer-block" />
          <div className="aurelia-pdp-skeleton-line aurelia-pdp-skeleton-line--copy-short aurelia-shimmer-block" />
          <div className="aurelia-pdp-skeleton-line aurelia-pdp-skeleton-line--stock aurelia-shimmer-block" />
          <div className="aurelia-pdp-skeleton-actions">
            <div className="aurelia-pdp-skeleton-line aurelia-pdp-skeleton-line--qty aurelia-shimmer-block" />
            <div className="aurelia-pdp-skeleton-line aurelia-pdp-skeleton-line--cta aurelia-shimmer-block" />
          </div>
        </div>
      </div>
    </section>
  )
}

const RecommendationsRailSkeleton = () => {
  const { t } = useI18n()
  return (
    <div className="aurelia-rec-track" aria-busy="true" aria-live="polite" aria-label={t("catalog.pdp.loadingRecs")}>
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="aurelia-rec-item" aria-hidden>
          <div className="aurelia-rec-skeleton-image aurelia-shimmer-block" />
          <div className="aurelia-rec-skeleton-caption aurelia-shimmer-block" />
        </div>
      ))}
    </div>
  )
}
