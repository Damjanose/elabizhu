import { animated, useSpring } from "@react-spring/web"
import type { CartLine } from "@jewellery/types"
import { motion, type Variants } from "motion/react"
import { Link } from "react-router-dom"
import { MotionLink } from "../components/motion/MotionLink"
import { useCart } from "../hooks/useCart"
import { EmptyState } from "../components/feedback/EmptyState"
import { fadeUp, listItem, listStagger, transition } from "../lib/motion"
import { successToast, toastFromError } from "../utils/toast"
import { useI18n, type Lang, type TFunction } from "../i18n"

const TAX_RATE = 0.2

const localeFor = (lang: Lang) => (lang === "sq" ? "sq-AL" : "en-GB")

const formatCurrency = (value: string | number, lang: Lang) =>
  new Intl.NumberFormat(localeFor(lang), {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))

const STEPS = [
  { id: "cart", labelKey: "account.steps.cart" },
  { id: "shipping", labelKey: "account.steps.shipping" },
  { id: "payment", labelKey: "account.steps.payment" },
] as const

const TRUST_BADGES = [
  { icon: "verified", labelKey: "account.trust.authenticated" },
  { icon: "lock", labelKey: "account.trust.securePayment" },
  { icon: "recycling", labelKey: "account.trust.ethical" },
] as const

export const CartPage = () => {
  const { t, lang } = useI18n()
  const {
    data,
    isLoading,
    isError,
    setQty,
    removeLine,
    isUpdating,
    refetch,
    isFetching,
    isGuest,
  } = useCart()

  if (isLoading) {
    return (
      <section className="aurelia-cart-shell" aria-busy="true" aria-live="polite" aria-label={t("account.cart.loadingAria")}>
        <Stepper activeIndex={0} />
        <div className="aurelia-cart-grid">
          <div className="aurelia-cart-main">
            <div className="aurelia-cart-skeleton-title aurelia-shimmer-block" aria-hidden />
            <div className="aurelia-cart-table" aria-hidden>
              {[0, 1, 2].map((index) => (
                <div key={index} className="aurelia-cart-skeleton-row">
                  <div className="aurelia-cart-skeleton-thumb aurelia-shimmer-block" />
                  <div>
                    <div className="aurelia-cart-skeleton-copy aurelia-shimmer-block" />
                    <div className="aurelia-cart-skeleton-copy aurelia-cart-skeleton-copy--short aurelia-shimmer-block" />
                  </div>
                  <div className="aurelia-cart-skeleton-total aurelia-shimmer-block" />
                </div>
              ))}
            </div>
          </div>
          <aside className="aurelia-cart-aside" aria-hidden>
            <div className="aurelia-cart-summary aurelia-cart-skeleton-aside aurelia-shimmer-block" />
          </aside>
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="aurelia-cart-shell">
        <Stepper activeIndex={0} />
        <EmptyState
          variant="card"
          tone="danger"
          icon="error"
          kicker={t("account.common.connectionIssue")}
          title={t("account.cart.loadError")}
          copy={t("account.common.unexpectedError")}
          cta={{ label: isFetching ? t("account.common.retrying") : t("account.common.tryAgain"), onClick: () => void refetch() }}
          secondaryCta={{ to: "/products", label: t("account.common.browseCollections") }}
        />
      </section>
    )
  }

  const items = data?.items ?? []

  if (items.length === 0) {
    return (
      <section className="aurelia-cart-shell">
        <Stepper activeIndex={0} />
        <EmptyState
          variant="card"
          icon="shopping_bag"
          kicker={t("account.cart.emptyKicker")}
          title={t("account.cart.emptyTitle")}
          copy={t("account.cart.emptyCopy")}
          cta={{ to: "/products", label: t("account.common.browseCollections") }}
          secondaryCta={{ to: "/categories", label: t("account.common.shopByCategory") }}
        />
      </section>
    )
  }

  const subtotalNumber = Number(data?.subtotal ?? 0)
  const estimatedTax = subtotalNumber * TAX_RATE
  const total = subtotalNumber + estimatedTax

  const checkoutTo = "/checkout"
  const checkoutLabel = isGuest ? t("account.cart.checkoutGuest") : t("account.cart.checkout")

  return (
    <motion.section className="aurelia-cart-shell" variants={fadeUp} initial="hidden" animate="visible">
      <Stepper activeIndex={0} />

      <div className="aurelia-cart-grid">
        <div className="aurelia-cart-main">
          <h1 className="aurelia-cart-title">{t("account.cart.title")}</h1>

          <div className="aurelia-cart-table" role="table" aria-label={t("account.cart.tableAria")}>
            <div className="aurelia-cart-thead" role="row">
              <span role="columnheader">{t("account.cart.colProduct")}</span>
              <span role="columnheader" className="text-center">{t("account.cart.colQuantity")}</span>
              <span role="columnheader" className="text-end">{t("account.cart.colTotal")}</span>
            </div>

            <motion.ul className="aurelia-cart-rows" variants={listStagger} initial="hidden" animate="visible">
              {items.map((line) => (
                <CartRow
                  key={line.productId}
                  line={line}
                  variants={listItem}
                  isUpdating={isUpdating}
                  onChangeQty={async (quantity) => {
                    try {
                      await setQty({ productId: line.productId, quantity })
                    } catch (err) {
                      toastFromError(err, t("account.cart.updateQtyError"))
                    }
                  }}
                  onRemove={async () => {
                    try {
                      await removeLine(line.productId)
                      successToast(t("account.cart.removed", { name: line.name }))
                    } catch (err) {
                      toastFromError(err, t("account.cart.removeError"))
                    }
                  }}
                />
              ))}
            </motion.ul>
          </div>

          <ShippingBanner />
        </div>

        <aside className="aurelia-cart-aside">
          <div className="aurelia-cart-summary">
            <h2 className="aurelia-cart-summary-title">{t("account.summary.title")}</h2>

            <dl className="aurelia-cart-summary-rows">
              <div>
                <dt>{t("account.summary.subtotal")}</dt>
                <dd>{formatCurrency(subtotalNumber, lang)}</dd>
              </div>
              <div>
                <dt>{t("account.summary.estimatedTaxes")}</dt>
                <dd>{formatCurrency(estimatedTax, lang)}</dd>
              </div>
              <div>
                <dt>{t("account.summary.shipping")}</dt>
                <dd className="aurelia-cart-summary-shipping">{t("account.common.complimentary")}</dd>
              </div>
            </dl>

            <div className="aurelia-cart-summary-total">
              <span className="aurelia-cart-summary-total-label">{t("account.summary.totalAmount")}</span>
              <span className="aurelia-cart-summary-total-value">{formatCurrency(total, lang)}</span>
            </div>

            <div className="aurelia-cart-summary-actions">
              <MotionLink
                to={checkoutTo}
                className="aurelia-cart-checkout"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={transition.quick}
              >
                <span>{checkoutLabel}</span>
                <span className="material-symbols-outlined" aria-hidden>
                  arrow_forward
                </span>
              </MotionLink>
              <p className="aurelia-cart-finance-note">
                {isGuest
                  ? t("account.cart.financeGuest")
                  : t("account.cart.financeKlarna")}
              </p>
            </div>

            <div className="aurelia-cart-trust">
              {TRUST_BADGES.map((badge) => (
                <div key={badge.labelKey} className="aurelia-cart-trust-item">
                  <span className="material-symbols-outlined" aria-hidden>
                    {badge.icon}
                  </span>
                  <p>{t(badge.labelKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </motion.section>
  )
}

const Stepper = ({ activeIndex }: { activeIndex: number }) => {
  const { t } = useI18n()
  return (
    <nav className="aurelia-cart-stepper" aria-label={t("account.stepper.aria")}>
      {STEPS.map((step, index) => {
        const state = index < activeIndex ? "complete" : index === activeIndex ? "active" : "upcoming"
        return (
          <div key={step.id} className={`aurelia-cart-stepper-item is-${state}`}>
            <div className="aurelia-cart-stepper-bullet" aria-hidden>
              {state === "complete" ? (
                <span className="material-symbols-outlined">check</span>
              ) : (
                index + 1
              )}
            </div>
            <span className="aurelia-cart-stepper-label">{t(step.labelKey)}</span>
            {index < STEPS.length - 1 && <span className="aurelia-cart-stepper-line" aria-hidden />}
          </div>
        )
      })}
    </nav>
  )
}

const CartRow = ({
  line,
  variants,
  isUpdating,
  onChangeQty,
  onRemove,
}: {
  line: CartLine
  variants: Variants
  isUpdating: boolean
  onChangeQty: (quantity: number) => void
  onRemove: () => void
}) => {
  const { t, lang } = useI18n()
  const meta = describeLine(line, t, lang)
  const qtySpring = useSpring({
    from: { transform: "scale(0.92)" },
    to: { transform: "scale(1)" },
    reset: true,
    config: { tension: 250, friction: 14 },
    pause: line.quantity <= 0,
  })

  return (
    <motion.li role="row" className="aurelia-cart-row" variants={variants}>
      <div className="aurelia-cart-cell aurelia-cart-cell--product" role="cell">
        <Link
          to={`/products/${line.productId}`}
          className="aurelia-cart-row-image overflow-hidden"
          aria-label={t("account.cart.viewItem", { name: line.name })}
        >
          {line.imageUrl ? (
            <motion.img
              src={line.imageUrl}
              alt={line.name}
              loading="lazy"
              whileHover={{ scale: 1.05 }}
              transition={transition.quick}
            />
          ) : (
            <div className="aurelia-cart-row-image-fallback" aria-hidden />
          )}
        </Link>
        <div className="aurelia-cart-row-meta">
          <Link to={`/products/${line.productId}`} className="aurelia-cart-row-name">
            {line.name}
          </Link>
          {meta && <p className="aurelia-cart-row-sub">{meta}</p>}
          <motion.button
            type="button"
            className="aurelia-cart-row-remove"
            onClick={onRemove}
            disabled={isUpdating}
            whileTap={isUpdating ? undefined : { scale: 0.97 }}
            transition={transition.quick}
          >
            {t("account.cart.remove")}
          </motion.button>
        </div>
      </div>

      <div className="aurelia-cart-cell aurelia-cart-cell--qty" role="cell">
        <span className="aurelia-cart-cell-label">{t("account.cart.colQuantity")}</span>
        <div className="aurelia-cart-qty" role="group" aria-label={t("account.cart.qtyGroup", { name: line.name })}>
          <motion.button
            type="button"
            aria-label={t("account.cart.decrease")}
            disabled={isUpdating || line.quantity <= 1}
            onClick={() => onChangeQty(Math.max(1, line.quantity - 1))}
            whileTap={isUpdating || line.quantity <= 1 ? undefined : { scale: 0.9 }}
            transition={transition.quick}
          >
            <span className="material-symbols-outlined" aria-hidden>remove</span>
          </motion.button>
          <animated.span className="aurelia-cart-qty-value" aria-live="polite" style={qtySpring}>
            {line.quantity}
          </animated.span>
          <motion.button
            type="button"
            aria-label={t("account.cart.increase")}
            disabled={isUpdating}
            onClick={() => onChangeQty(line.quantity + 1)}
            whileTap={isUpdating ? undefined : { scale: 0.9 }}
            transition={transition.quick}
          >
            <span className="material-symbols-outlined" aria-hidden>add</span>
          </motion.button>
        </div>
      </div>

      <div className="aurelia-cart-cell aurelia-cart-cell--total" role="cell">
        <span className="aurelia-cart-cell-label">{t("account.cart.colTotal")}</span>
        <span className="aurelia-cart-row-total">
          {formatCurrency(Number(line.price) * line.quantity, lang)}
        </span>
      </div>
    </motion.li>
  )
}

const ShippingBanner = () => {
  const { t } = useI18n()
  return (
    <aside className="aurelia-cart-banner" role="note">
      <span className="material-symbols-outlined aurelia-cart-banner-icon" aria-hidden>
        local_shipping
      </span>
      <div>
        <p className="aurelia-cart-banner-title">{t("account.cart.shippingTitle")}</p>
        <p className="aurelia-cart-banner-copy">{t("account.cart.shippingCopy")}</p>
      </div>
    </aside>
  )
}

// Best-effort to derive the secondary "18K Gold / 0.5ct Diamond" style line.
// The cart line API only exposes name/price/qty/imageUrl, so we surface unit price
// as a refined sub-line when nothing richer is available.
const describeLine = (line: CartLine, t: TFunction, lang: Lang) => {
  const unit = formatCurrency(line.price, lang)
  return t("account.common.each", { price: unit })
}
