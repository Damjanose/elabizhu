import type { CartLine } from "@jewellery/types"
import { Link } from "react-router-dom"
import { useCart } from "../hooks/useCart"
import { EmptyState } from "../components/feedback/EmptyState"
import { successToast, toastFromError } from "../utils/toast"

const TAX_RATE = 0.2

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))

const STEPS = [
  { id: "cart", label: "Cart" },
  { id: "shipping", label: "Shipping" },
  { id: "payment", label: "Payment" },
] as const

const TRUST_BADGES = [
  { icon: "verified", label: "Authenticated" },
  { icon: "lock", label: "Secure Payment" },
  { icon: "recycling", label: "Ethical Sourcing" },
] as const

export const CartPage = () => {
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
      <section className="aurelia-cart-shell">
        <Stepper activeIndex={0} />
        <EmptyState
          variant="card"
          icon="hourglass_empty"
          kicker="Loading"
          title="Retrieving your selection…"
          copy="One moment while we gather what you’ve set aside."
        />
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
          kicker="Connection Issue"
          title="We couldn’t load your cart"
          copy="An unexpected error interrupted our request. Please try again."
          cta={{ label: isFetching ? "Retrying…" : "Try Again", onClick: () => void refetch() }}
          secondaryCta={{ to: "/products", label: "Browse Collections" }}
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
          kicker="Your Atelier"
          title="Your cart is empty"
          copy="When you set a piece aside, it will rest here until you’re ready to continue."
          cta={{ to: "/products", label: "Browse Collections" }}
          secondaryCta={{ to: "/categories", label: "Shop by Category" }}
        />
      </section>
    )
  }

  const subtotalNumber = Number(data?.subtotal ?? 0)
  const estimatedTax = subtotalNumber * TAX_RATE
  const total = subtotalNumber + estimatedTax

  const checkoutTo = isGuest ? `/login?redirect=${encodeURIComponent("/checkout")}` : "/checkout"
  const checkoutLabel = isGuest ? "Sign in to Checkout" : "Proceed to Checkout"

  return (
    <section className="aurelia-cart-shell">
      <Stepper activeIndex={0} />

      <div className="aurelia-cart-grid">
        <div className="aurelia-cart-main">
          <h1 className="aurelia-cart-title">Your Selection</h1>

          <div className="aurelia-cart-table" role="table" aria-label="Cart items">
            <div className="aurelia-cart-thead" role="row">
              <span role="columnheader">Product</span>
              <span role="columnheader" className="text-center">Quantity</span>
              <span role="columnheader" className="text-end">Total</span>
            </div>

            <ul className="aurelia-cart-rows">
              {items.map((line) => (
                <CartRow
                  key={line.productId}
                  line={line}
                  isUpdating={isUpdating}
                  onChangeQty={async (quantity) => {
                    try {
                      await setQty({ productId: line.productId, quantity })
                    } catch (err) {
                      toastFromError(err, "Could not update quantity")
                    }
                  }}
                  onRemove={async () => {
                    try {
                      await removeLine(line.productId)
                      successToast(`“${line.name}” removed from cart`)
                    } catch (err) {
                      toastFromError(err, "Could not remove item")
                    }
                  }}
                />
              ))}
            </ul>
          </div>

          <ShippingBanner />
        </div>

        <aside className="aurelia-cart-aside">
          <div className="aurelia-cart-summary">
            <h2 className="aurelia-cart-summary-title">Summary</h2>

            <dl className="aurelia-cart-summary-rows">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatCurrency(subtotalNumber)}</dd>
              </div>
              <div>
                <dt>Estimated Taxes</dt>
                <dd>{formatCurrency(estimatedTax)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd className="aurelia-cart-summary-shipping">Complimentary</dd>
              </div>
            </dl>

            <div className="aurelia-cart-summary-total">
              <span className="aurelia-cart-summary-total-label">Total Amount</span>
              <span className="aurelia-cart-summary-total-value">{formatCurrency(total)}</span>
            </div>

            <div className="aurelia-cart-summary-actions">
              <Link to={checkoutTo} className="aurelia-cart-checkout">
                <span>{checkoutLabel}</span>
                <span className="material-symbols-outlined" aria-hidden>
                  arrow_forward
                </span>
              </Link>
              <p className="aurelia-cart-finance-note">
                {isGuest
                  ? "Your selection is saved on this device. Sign in to securely complete the order."
                  : "Interest-free financing available via Klarna."}
              </p>
            </div>

            <div className="aurelia-cart-trust">
              {TRUST_BADGES.map((badge) => (
                <div key={badge.label} className="aurelia-cart-trust-item">
                  <span className="material-symbols-outlined" aria-hidden>
                    {badge.icon}
                  </span>
                  <p>{badge.label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

const Stepper = ({ activeIndex }: { activeIndex: number }) => (
  <nav className="aurelia-cart-stepper" aria-label="Checkout progress">
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
          <span className="aurelia-cart-stepper-label">{step.label}</span>
          {index < STEPS.length - 1 && <span className="aurelia-cart-stepper-line" aria-hidden />}
        </div>
      )
    })}
  </nav>
)

const CartRow = ({
  line,
  isUpdating,
  onChangeQty,
  onRemove,
}: {
  line: CartLine
  isUpdating: boolean
  onChangeQty: (quantity: number) => void
  onRemove: () => void
}) => {
  const meta = describeLine(line)
  return (
    <li role="row" className="aurelia-cart-row">
      <div className="aurelia-cart-cell aurelia-cart-cell--product" role="cell">
        <Link
          to={`/products/${line.productId}`}
          className="aurelia-cart-row-image"
          aria-label={`View ${line.name}`}
        >
          {line.imageUrl ? (
            <img src={line.imageUrl} alt={line.name} loading="lazy" />
          ) : (
            <div className="aurelia-cart-row-image-fallback" aria-hidden />
          )}
        </Link>
        <div className="aurelia-cart-row-meta">
          <Link to={`/products/${line.productId}`} className="aurelia-cart-row-name">
            {line.name}
          </Link>
          {meta && <p className="aurelia-cart-row-sub">{meta}</p>}
          <button
            type="button"
            className="aurelia-cart-row-remove"
            onClick={onRemove}
            disabled={isUpdating}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="aurelia-cart-cell aurelia-cart-cell--qty" role="cell">
        <span className="aurelia-cart-cell-label">Qty</span>
        <div className="aurelia-cart-qty" role="group" aria-label={`Quantity for ${line.name}`}>
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={isUpdating || line.quantity <= 1}
            onClick={() => onChangeQty(Math.max(1, line.quantity - 1))}
          >
            <span className="material-symbols-outlined" aria-hidden>remove</span>
          </button>
          <span className="aurelia-cart-qty-value" aria-live="polite">
            {line.quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={isUpdating}
            onClick={() => onChangeQty(line.quantity + 1)}
          >
            <span className="material-symbols-outlined" aria-hidden>add</span>
          </button>
        </div>
      </div>

      <div className="aurelia-cart-cell aurelia-cart-cell--total" role="cell">
        <span className="aurelia-cart-cell-label">Total</span>
        <span className="aurelia-cart-row-total">
          {formatCurrency(Number(line.price) * line.quantity)}
        </span>
      </div>
    </li>
  )
}

const ShippingBanner = () => (
  <aside className="aurelia-cart-banner" role="note">
    <span className="material-symbols-outlined aurelia-cart-banner-icon" aria-hidden>
      local_shipping
    </span>
    <div>
      <p className="aurelia-cart-banner-title">Complimentary White-Glove Delivery</p>
      <p className="aurelia-cart-banner-copy">
        Insured worldwide shipping is included with your selection today.
      </p>
    </div>
  </aside>
)

// Best-effort to derive the secondary "18K Gold / 0.5ct Diamond" style line.
// The cart line API only exposes name/price/qty/imageUrl, so we surface unit price
// as a refined sub-line when nothing richer is available.
const describeLine = (line: CartLine) => {
  const unit = formatCurrency(line.price)
  return `${unit} each`
}
