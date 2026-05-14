import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Address } from "@jewellery/types"
import axios from "axios"
import { Formik, Form, useFormikContext, type FormikHelpers } from "formik"
import { motion } from "motion/react"
import { MotionLink } from "../components/motion/MotionLink"
import * as Yup from "yup"
import { useNavigate } from "react-router-dom"
import { fadeUp, listItem, listStagger, scrollRevealViewport, transition } from "../lib/motion"
import { checkout } from "../services/orders"
import { fetchAddresses } from "../services/profile"
import { useOrderStore } from "../stores/orderStore"
import { useCart } from "../hooks/useCart"
import { useQueryLoadState } from "../hooks/useQueryLoadState"
import { queryKeys } from "../lib/query-keys"
import { queryTiming } from "../lib/query-client"
import { useAuth } from "../types/auth-context"
import { EmptyState } from "../components/feedback/EmptyState"
import { EditorialFormField } from "../components/forms/FormFields"
import { errorToast, successToast } from "../utils/toast"

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

type CheckoutValues = {
  firstName: string
  lastName: string
  address: string
  city: string
  postalCode: string
  phone: string
  paymentMethod: string
}

const initialValues: CheckoutValues = {
  firstName: "",
  lastName: "",
  address: "",
  city: "",
  postalCode: "",
  phone: "",
  paymentMethod: "card",
}

const checkoutSchema = Yup.object({
  firstName: Yup.string().trim().required("First name is required"),
  lastName: Yup.string().trim().required("Last name is required"),
  address: Yup.string().trim().required("Shipping address is required"),
  city: Yup.string().trim().required("City is required"),
  postalCode: Yup.string().trim().required("Postal code is required"),
  phone: Yup.string().trim(),
  paymentMethod: Yup.string()
    .oneOf(PAYMENT_OPTIONS.map((o) => o.id), "Please select a payment method")
    .required("Please select a payment method"),
})

const splitName = (fullName?: string | null) => {
  if (!fullName) return { firstName: "", lastName: "" }
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0] ?? "", lastName: "" }
  const [firstName, ...rest] = parts
  return { firstName: firstName ?? "", lastName: rest.join(" ") }
}

const pickDefaultSavedAddress = (addresses: Address[] | undefined): Address | null => {
  if (!addresses?.length) return null
  return addresses.find((a) => a.isDefault) ?? addresses[0] ?? null
}

const streetFromAddress = (addr: Address) => {
  const street = [addr.line1, addr.line2].map((s) => s?.trim()).filter(Boolean).join(", ")
  const country = addr.country?.trim()
  if (!country) return street
  return street ? `${street}, ${country}` : country
}

export const CheckoutPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setLast = useOrderStore((s) => s.setLastCheckoutId)
  const { user } = useAuth()
  const isAuthed = !!user
  const addressesQuery = useQuery({
    queryKey: queryKeys.me.addresses(),
    queryFn: fetchAddresses,
    enabled: isAuthed,
    staleTime: queryTiming.sessionStaleTime,
  })
  const { showSkeleton: showAddressesSkeleton } = useQueryLoadState(addressesQuery)
  const { data: cart, isLoading: cartLoading, isFetching: cartFetching } = useCart()
  const [formError, setFormError] = useState<string | null>(null)

  const items = cart?.items ?? []
  const subtotalNumber = Number(cart?.subtotal ?? 0)
  const estimatedTax = subtotalNumber * TAX_RATE
  const total = subtotalNumber + estimatedTax

  const initial = useMemo<CheckoutValues>(() => {
    const { firstName, lastName } = splitName(user?.fullName)
    const base: CheckoutValues = {
      ...initialValues,
      firstName,
      lastName,
      phone: user?.phone ?? "",
    }
    const saved = pickDefaultSavedAddress(addressesQuery.data)
    if (!saved) return base
    const { firstName: sf, lastName: sl } = splitName(saved.recipientName)
    return {
      ...base,
      firstName: sf || base.firstName,
      lastName: sl || base.lastName,
      address: streetFromAddress(saved),
      city: saved.city,
      postalCode: saved.postalCode,
      phone: saved.phone?.trim() || base.phone,
    }
  }, [user, addressesQuery.data])

  const m = useMutation({
    mutationFn: checkout,
    onSuccess: (order) => {
      setLast(order.id)
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders() })
      successToast(`Order placed · #AUR-${order.id.slice(0, 6).toUpperCase()}`)
      navigate(`/orders/${order.id}`)
    },
  })

  const handleSubmit = async (values: CheckoutValues, helpers: FormikHelpers<CheckoutValues>) => {
    setFormError(null)
    const recipient = `${values.firstName.trim()} ${values.lastName.trim()}`.trim()
    const cityLine = [values.city.trim(), values.postalCode.trim()].filter(Boolean).join(", ")
    const shippingAddress = [recipient, values.address.trim(), cityLine, values.phone.trim()]
      .filter(Boolean)
      .join("\n")

    try {
      await m.mutateAsync({
        shippingAddress,
        paymentMethod: values.paymentMethod,
      })
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string })?.message ?? err.message)
        : err instanceof Error
          ? err.message
          : "Checkout failed"
      setFormError(message)
      errorToast(message)
    } finally {
      helpers.setSubmitting(false)
    }
  }

  // Empty cart guard
  if (!cartLoading && items.length === 0) {
    return (
      <motion.section className="aurelia-checkout-shell" variants={fadeUp} initial="hidden" animate="visible">
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
      </motion.section>
    )
  }

  if (isAuthed && showAddressesSkeleton) {
    return (
      <motion.section
        className="aurelia-checkout-shell"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        aria-busy="true"
        aria-live="polite"
        aria-label="Loading checkout"
      >
        <Stepper activeIndex={1} />
        <div className="aurelia-checkout-grid">
          <div aria-hidden>
            <div className="aurelia-checkout-skeleton-header aurelia-shimmer-block" />
            <div className="aurelia-checkout-skeleton-sub aurelia-shimmer-block" />
            <div className="aurelia-checkout-fields">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div key={index} className="aurelia-checkout-skeleton-field aurelia-shimmer-block" />
              ))}
            </div>
          </div>
          <aside className="aurelia-checkout-summary aurelia-checkout-skeleton-summary aurelia-shimmer-block" aria-hidden />
        </div>
      </motion.section>
    )
  }

  return (
    <motion.section className="aurelia-checkout-shell" variants={fadeUp} initial="hidden" animate="visible">
      <Stepper activeIndex={1} />

      <div className="aurelia-checkout-grid">
        <Formik
          initialValues={initial}
          enableReinitialize
          validationSchema={checkoutSchema}
          onSubmit={handleSubmit}
          validateOnBlur
          validateOnChange
        >
          {({ isSubmitting, submitCount, isValid, values, setFieldValue, setFieldTouched }) => {
            const showInvalidBanner = !formError && submitCount > 0 && !isValid

            return (
              <Form className="aurelia-checkout-form" noValidate>
                <motion.header
                  className="aurelia-checkout-header"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={scrollRevealViewport}
                >
                  <p className="aurelia-checkout-kicker">Step 2 · Shipping & Payment</p>
                  <h1 className="aurelia-checkout-title">Shipping Details</h1>
                  <p className="aurelia-checkout-sub">
                    Tell us where your piece should arrive. We will only contact you about this order.
                  </p>
                </motion.header>

                <div className="aurelia-checkout-fields">
                  <EditorialFormField
                    name="firstName"
                    label="First Name"
                    placeholder="John"
                    autoComplete="given-name"
                    required
                  />
                  <EditorialFormField
                    name="lastName"
                    label="Last Name"
                    placeholder="Doe"
                    autoComplete="family-name"
                    required
                  />
                  <EditorialFormField
                    name="address"
                    label="Shipping Address"
                    colSpan={2}
                    placeholder="123 Mayfair Terrace"
                    autoComplete="street-address"
                    required
                  />
                  <EditorialFormField
                    name="city"
                    label="City"
                    placeholder="London"
                    autoComplete="address-level2"
                    required
                  />
                  <EditorialFormField
                    name="postalCode"
                    label="Postal Code"
                    placeholder="W1K 7AA"
                    autoComplete="postal-code"
                    required
                  />
                  <EditorialFormField
                    name="phone"
                    label="Phone Number"
                    colSpan={2}
                    type="tel"
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
                      const checked = values.paymentMethod === option.id
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
                            onChange={() => {
                              void setFieldValue("paymentMethod", option.id)
                              void setFieldTouched("paymentMethod", true, false)
                            }}
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

                {(formError || showInvalidBanner) && (
                  <div className="aurelia-checkout-error" role="alert">
                    <span className="material-symbols-outlined" aria-hidden>error</span>
                    <span>
                      {formError ??
                        "Please fix the highlighted fields and try again."}
                    </span>
                  </div>
                )}

                <CheckoutActions isSubmitting={isSubmitting} />
              </Form>
            )
          }}
        </Formik>

        <motion.aside className="aurelia-checkout-aside" variants={fadeUp} initial="hidden" animate="visible">
          <div className="aurelia-checkout-summary">
            <h2 className="aurelia-checkout-summary-title">Order Summary</h2>

            <motion.ul className="aurelia-checkout-summary-items" variants={listStagger} initial="hidden" animate="visible">
              {items.map((line) => (
                <motion.li key={line.productId} className="aurelia-checkout-summary-item" variants={listItem}>
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
                </motion.li>
              ))}
              {cartLoading && items.length === 0 && (
                <>
                  {[0, 1].map((index) => (
                    <li key={index} className="aurelia-checkout-summary-skeleton-row" aria-hidden>
                      <div className="aurelia-checkout-summary-skeleton-thumb aurelia-shimmer-block" />
                      <div>
                        <div className="aurelia-checkout-summary-skeleton-copy aurelia-shimmer-block" />
                        <div className="aurelia-checkout-summary-skeleton-copy aurelia-checkout-summary-skeleton-copy--short aurelia-shimmer-block" />
                      </div>
                      <div className="aurelia-checkout-summary-skeleton-total aurelia-shimmer-block" />
                    </li>
                  ))}
                </>
              )}
            </motion.ul>

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
        </motion.aside>
      </div>
    </motion.section>
  )
}

const CheckoutActions = ({ isSubmitting }: { isSubmitting: boolean }) => {
  // Marks every field as touched so all validation messages surface on the first submit.
  const { validateForm, setTouched, values } = useFormikContext<CheckoutValues>()

  return (
    <div className="aurelia-checkout-actions">
      <MotionLink
        to="/cart"
        className="aurelia-checkout-back"
        whileHover={{ x: -3 }}
        whileTap={{ scale: 0.98 }}
        transition={transition.quick}
      >
        <span className="material-symbols-outlined" aria-hidden>chevron_left</span>
        <span>Return to Cart</span>
      </MotionLink>
      <motion.button
        type="submit"
        className="aurelia-checkout-submit"
        disabled={isSubmitting}
        whileHover={isSubmitting ? undefined : { scale: 1.02, y: -1 }}
        whileTap={isSubmitting ? undefined : { scale: 0.97 }}
        transition={transition.quick}
        onClick={() => {
          // Pre-emptively touch every field so messages show even if the user never blurred them.
          const touched = Object.keys(values).reduce<Record<string, boolean>>((acc, key) => {
            acc[key] = true
            return acc
          }, {})
          void setTouched(touched, true)
          void validateForm()
        }}
      >
        <span>{isSubmitting ? "Placing Order…" : "Place Order"}</span>
        <span className="material-symbols-outlined" aria-hidden>arrow_forward</span>
      </motion.button>
    </div>
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
