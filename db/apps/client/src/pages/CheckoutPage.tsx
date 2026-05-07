import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { checkout } from "../services/orders"
import { useOrderStore } from "../stores/orderStore"
import { useCart } from "../hooks/useCart"
import { useAuth } from "../types/auth-context"
import { EmptyState } from "../components/feedback/EmptyState"

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

const PAYMENT_OPTIONS = [
  { id: "card", label: "Card (simulated)", helper: "Visa, Mastercard, Amex" },
  { id: "cod", label: "Cash on delivery", helper: "Pay when your piece arrives" },
  { id: "bank", label: "Bank transfer", helper: "Receive instructions by email" },
] as const

type FormState = {
  firstName: string
  lastName: string
  address: string
  city: string
  postalCode: string
  phone: string
  paymentMethod: string
}

const splitName = (fullName?: string | null) => {
  if (!fullName) return { firstName: "", lastName: "" }
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0] ?? "", lastName: "" }
  const [firstName, ...rest] = parts
  return { firstName: firstName ?? "", lastName: rest.join(" ") }
}

export const CheckoutPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setLast = useOrderStore((s) => s.setLastCheckoutId)
  const { user } = useAuth()
  const { data: cart, isLoading: cartLoading, isFetching: cartFetching } = useCart()

  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    paymentMethod: "card",
  })

  // Pre-fill name from authenticated user once available.
  useEffect(() => {
    if (!user) return
    const { firstName, lastName } = splitName(user.fullName)
    setForm((current) => ({
      firstName: current.firstName || firstName,
      lastName: current.lastName || lastName,
      address: current.address,
      city: current.city,
      postalCode: current.postalCode,
      phone: current.phone,
      paymentMethod: current.paymentMethod,
    }))
  }, [user])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const items = cart?.items ?? []
  const subtotalNumber = Number(cart?.subtotal ?? 0)
  const estimatedTax = subtotalNumber * TAX_RATE
  const total = subtotalNumber + estimatedTax

  const requiredFilled =
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    form.address.trim().length > 0 &&
    form.city.trim().length > 0 &&
    form.postalCode.trim().length > 0

  const composedShippingAddress = useMemo(() => {
    const recipient = `${form.firstName.trim()} ${form.lastName.trim()}`.trim()
    const cityLine = [form.city.trim(), form.postalCode.trim()].filter(Boolean).join(", ")
    return [recipient, form.address.trim(), cityLine, form.phone.trim()]
      .filter(Boolean)
      .join("\n")
  }, [form])

  const m = useMutation({
    mutationFn: checkout,
    onSuccess: (order) => {
      setLast(order.id)
      void queryClient.invalidateQueries({ queryKey: ["cart"] })
      void queryClient.invalidateQueries({ queryKey: ["orders"] })
      navigate(`/orders/${order.id}`)
    },
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!requiredFilled || m.isPending) return
    void m.mutateAsync({
      shippingAddress: composedShippingAddress,
      paymentMethod: form.paymentMethod,
    })
  }

  const errorMessage = m.isError
    ? axios.isAxiosError(m.error)
      ? String((m.error.response?.data as { message?: string })?.message ?? m.error.message)
      : m.error instanceof Error
        ? m.error.message
        : "Checkout failed"
    : null

  // Empty cart guard
  if (!cartLoading && items.length === 0) {
    return (
      <section className="aurelia-checkout-shell">
        <Stepper activeIndex={1} />
        <EmptyState
          variant="card"
          icon="shopping_bag"
          kicker="Empty Cart"
          title="There’s nothing to check out yet"
          copy="Add a piece to your selection before continuing."
          cta={{ to: "/products", label: "Browse Collections" }}
          secondaryCta={{ to: "/cart", label: "Return to Cart" }}
        />
      </section>
    )
  }

  return (
    <section className="aurelia-checkout-shell">
      <Stepper activeIndex={1} />

      <div className="aurelia-checkout-grid">
        <form className="aurelia-checkout-form" onSubmit={handleSubmit} noValidate>
          <header className="aurelia-checkout-header">
            <p className="aurelia-checkout-kicker">Step 2 · Shipping & Payment</p>
            <h1 className="aurelia-checkout-title">Shipping Details</h1>
            <p className="aurelia-checkout-sub">
              Tell us where your piece should arrive. We will only contact you about this order.
            </p>
          </header>

          <div className="aurelia-checkout-fields">
            <Field
              label="First Name"
              colSpan={1}
              value={form.firstName}
              onChange={(value) => update("firstName", value)}
              placeholder="John"
              autoComplete="given-name"
              required
            />
            <Field
              label="Last Name"
              colSpan={1}
              value={form.lastName}
              onChange={(value) => update("lastName", value)}
              placeholder="Doe"
              autoComplete="family-name"
              required
            />
            <Field
              label="Shipping Address"
              colSpan={2}
              value={form.address}
              onChange={(value) => update("address", value)}
              placeholder="123 Mayfair Terrace"
              autoComplete="street-address"
              required
            />
            <Field
              label="City"
              colSpan={1}
              value={form.city}
              onChange={(value) => update("city", value)}
              placeholder="London"
              autoComplete="address-level2"
              required
            />
            <Field
              label="Postal Code"
              colSpan={1}
              value={form.postalCode}
              onChange={(value) => update("postalCode", value)}
              placeholder="W1K 7AA"
              autoComplete="postal-code"
              required
            />
            <Field
              label="Phone Number"
              colSpan={2}
              type="tel"
              value={form.phone}
              onChange={(value) => update("phone", value)}
              placeholder="+44 20 1234 5678"
              autoComplete="tel"
            />
          </div>

          <fieldset className="aurelia-checkout-payment">
            <legend className="aurelia-checkout-payment-legend">Payment Method</legend>
            <p className="aurelia-checkout-payment-note">
              MVP checkout captures a payment label only — no card processor is charged.
            </p>
            <div className="aurelia-checkout-payment-options">
              {PAYMENT_OPTIONS.map((option) => {
                const checked = form.paymentMethod === option.id
                return (
                  <label
                    key={option.id}
                    className={`aurelia-checkout-payment-option${checked ? " is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={option.id}
                      checked={checked}
                      onChange={() => update("paymentMethod", option.id)}
                    />
                    <span className="aurelia-checkout-payment-bullet" aria-hidden />
                    <span className="aurelia-checkout-payment-text">
                      <span className="aurelia-checkout-payment-label">{option.label}</span>
                      <span className="aurelia-checkout-payment-helper">{option.helper}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          {errorMessage && (
            <div className="aurelia-checkout-error" role="alert">
              <span className="material-symbols-outlined" aria-hidden>error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="aurelia-checkout-actions">
            <Link to="/cart" className="aurelia-checkout-back">
              <span className="material-symbols-outlined" aria-hidden>chevron_left</span>
              <span>Return to Cart</span>
            </Link>
            <button
              type="submit"
              className="aurelia-checkout-submit"
              disabled={m.isPending || !requiredFilled}
            >
              <span>{m.isPending ? "Placing Order…" : "Place Order"}</span>
              <span className="material-symbols-outlined" aria-hidden>arrow_forward</span>
            </button>
          </div>
        </form>

        <aside className="aurelia-checkout-aside">
          <div className="aurelia-checkout-summary">
            <h2 className="aurelia-checkout-summary-title">Order Summary</h2>

            <ul className="aurelia-checkout-summary-items">
              {items.map((line) => (
                <li key={line.productId} className="aurelia-checkout-summary-item">
                  <div className="aurelia-checkout-summary-thumb">
                    {line.imageUrl ? (
                      <img src={line.imageUrl} alt={line.name} loading="lazy" />
                    ) : (
                      <div className="aurelia-checkout-summary-thumb-fallback" aria-hidden />
                    )}
                    <span className="aurelia-checkout-summary-qty" aria-label={`Quantity ${line.quantity}`}>
                      {line.quantity}
                    </span>
                  </div>
                  <div className="aurelia-checkout-summary-meta">
                    <p className="aurelia-checkout-summary-name">{line.name}</p>
                    <p className="aurelia-checkout-summary-unit">{formatCurrency(line.price)} each</p>
                  </div>
                  <span className="aurelia-checkout-summary-line-total">
                    {formatCurrency(Number(line.price) * line.quantity)}
                  </span>
                </li>
              ))}
              {cartLoading && items.length === 0 && (
                <li className="aurelia-checkout-summary-loading">Loading items…</li>
              )}
            </ul>

            <dl className="aurelia-checkout-summary-rows">
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
                <dd className="aurelia-checkout-summary-shipping">Complimentary</dd>
              </div>
            </dl>

            <div className="aurelia-checkout-summary-total">
              <span className="aurelia-checkout-summary-total-label">Total Amount</span>
              <span className="aurelia-checkout-summary-total-value">{formatCurrency(total)}</span>
            </div>

            {cartFetching && (
              <p className="aurelia-checkout-summary-syncing">Syncing latest pricing…</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}

const Stepper = ({ activeIndex }: { activeIndex: number }) => (
  <nav className="aurelia-cart-stepper" aria-label="Checkout progress">
    {STEPS.map((step, index) => {
      const state =
        index < activeIndex ? "complete" : index === activeIndex ? "active" : "upcoming"
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

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  type?: string
  required?: boolean
  colSpan: 1 | 2
}

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  type = "text",
  required,
  colSpan,
}: FieldProps) => (
  <div
    className={`aurelia-checkout-field aurelia-checkout-field--span-${colSpan}${
      value ? " is-filled" : ""
    }`}
  >
    <label className="aurelia-checkout-label">
      {label}
      {required && <span aria-hidden> *</span>}
    </label>
    <input
      className="aurelia-checkout-input"
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required={required}
    />
  </div>
)
