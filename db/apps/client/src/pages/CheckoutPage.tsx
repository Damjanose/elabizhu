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

const PAYMENT_OPTIONS = [
  { id: "card", labelKey: "account.checkout.paymentCard", helperKey: "account.checkout.paymentCardHelper" },
  { id: "cod", labelKey: "account.checkout.paymentCod", helperKey: "account.checkout.paymentCodHelper" },
  { id: "bank", labelKey: "account.checkout.paymentBank", helperKey: "account.checkout.paymentBankHelper" },
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

const makeCheckoutSchema = (t: TFunction) =>
  Yup.object({
    firstName: Yup.string().trim().required(t("account.validation.firstNameRequired")),
    lastName: Yup.string().trim().required(t("account.validation.lastNameRequired")),
    address: Yup.string().trim().required(t("account.validation.shippingAddressRequired")),
    city: Yup.string().trim().required(t("account.validation.cityRequired")),
    postalCode: Yup.string().trim().required(t("account.validation.postalCodeRequired")),
    phone: Yup.string().trim(),
    paymentMethod: Yup.string()
      .oneOf(PAYMENT_OPTIONS.map((o) => o.id), t("account.validation.paymentRequired"))
      .required(t("account.validation.paymentRequired")),
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
  const { t, lang } = useI18n()
  const checkoutSchema = makeCheckoutSchema(t)
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
      successToast(t("account.checkout.placed", { ref: `#AUR-${order.id.slice(0, 6).toUpperCase()}` }))
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
          : t("account.checkout.failed")
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
          kicker={t("account.checkout.emptyKicker")}
          title={t("account.checkout.emptyTitle")}
          copy={t("account.checkout.emptyCopy")}
          cta={{ to: "/products", label: t("account.common.browseCollections") }}
          secondaryCta={{ to: "/cart", label: t("account.common.returnToCart") }}
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
        aria-label={t("account.checkout.loadingAria")}
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
                  <p className="aurelia-checkout-kicker">{t("account.checkout.kicker")}</p>
                  <h1 className="aurelia-checkout-title">{t("account.checkout.title")}</h1>
                  <p className="aurelia-checkout-sub">{t("account.checkout.sub")}</p>
                </motion.header>

                <div className="aurelia-checkout-fields">
                  <EditorialFormField
                    name="firstName"
                    label={t("account.field.firstName")}
                    placeholder="John"
                    autoComplete="given-name"
                    required
                  />
                  <EditorialFormField
                    name="lastName"
                    label={t("account.field.lastName")}
                    placeholder="Doe"
                    autoComplete="family-name"
                    required
                  />
                  <EditorialFormField
                    name="address"
                    label={t("account.field.shippingAddress")}
                    colSpan={2}
                    placeholder={t("account.placeholder.address")}
                    autoComplete="street-address"
                    required
                  />
                  <EditorialFormField
                    name="city"
                    label={t("account.field.city")}
                    placeholder={t("account.placeholder.city")}
                    autoComplete="address-level2"
                    required
                  />
                  <EditorialFormField
                    name="postalCode"
                    label={t("account.field.postalCode")}
                    placeholder={t("account.placeholder.postalCode")}
                    autoComplete="postal-code"
                    required
                  />
                  <EditorialFormField
                    name="phone"
                    label={t("account.field.phoneNumber")}
                    colSpan={2}
                    type="tel"
                    placeholder="+44 20 1234 5678"
                    autoComplete="tel"
                  />
                </div>

                <fieldset className="aurelia-checkout-payment">
                  <legend className="aurelia-checkout-payment-legend">{t("account.checkout.paymentLegend")}</legend>
                  <p className="aurelia-checkout-payment-note">
                    {t("account.checkout.paymentNote")}
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
                            <span className="aurelia-checkout-payment-label">{t(option.labelKey)}</span>
                            <span className="aurelia-checkout-payment-helper">{t(option.helperKey)}</span>
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
                      {formError ?? t("account.validation.fixFields")}
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
            <h2 className="aurelia-checkout-summary-title">{t("account.checkout.summaryTitle")}</h2>

            <motion.ul className="aurelia-checkout-summary-items" variants={listStagger} initial="hidden" animate="visible">
              {items.map((line) => (
                <motion.li key={line.productId} className="aurelia-checkout-summary-item" variants={listItem}>
                  <div className="aurelia-checkout-summary-thumb">
                    {line.imageUrl ? (
                      <img src={line.imageUrl} alt={line.name} loading="lazy" />
                    ) : (
                      <div className="aurelia-checkout-summary-thumb-fallback" aria-hidden />
                    )}
                    <span className="aurelia-checkout-summary-qty" aria-label={t("account.checkout.quantityAria", { quantity: line.quantity })}>
                      {line.quantity}
                    </span>
                  </div>
                  <div className="aurelia-checkout-summary-meta">
                    <p className="aurelia-checkout-summary-name">{line.name}</p>
                    <p className="aurelia-checkout-summary-unit">{t("account.common.each", { price: formatCurrency(line.price, lang) })}</p>
                  </div>
                  <span className="aurelia-checkout-summary-line-total">
                    {formatCurrency(Number(line.price) * line.quantity, lang)}
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
                <dt>{t("account.summary.subtotal")}</dt>
                <dd>{formatCurrency(subtotalNumber, lang)}</dd>
              </div>
              <div>
                <dt>{t("account.summary.estimatedTaxes")}</dt>
                <dd>{formatCurrency(estimatedTax, lang)}</dd>
              </div>
              <div>
                <dt>{t("account.summary.shipping")}</dt>
                <dd className="aurelia-checkout-summary-shipping">{t("account.common.complimentary")}</dd>
              </div>
            </dl>

            <div className="aurelia-checkout-summary-total">
              <span className="aurelia-checkout-summary-total-label">{t("account.summary.totalAmount")}</span>
              <span className="aurelia-checkout-summary-total-value">{formatCurrency(total, lang)}</span>
            </div>

            {cartFetching && (
              <p className="aurelia-checkout-summary-syncing">{t("account.checkout.syncing")}</p>
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
  const { t } = useI18n()

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
        <span>{t("account.common.returnToCart")}</span>
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
        <span>{isSubmitting ? t("account.checkout.placingOrder") : t("account.checkout.placeOrder")}</span>
        <span className="material-symbols-outlined" aria-hidden>arrow_forward</span>
      </motion.button>
    </div>
  )
}

const Stepper = ({ activeIndex }: { activeIndex: number }) => {
  const { t } = useI18n()
  return (
    <nav className="aurelia-cart-stepper" aria-label={t("account.stepper.aria")}>
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
            <span className="aurelia-cart-stepper-label">{t(step.labelKey)}</span>
            {index < STEPS.length - 1 && <span className="aurelia-cart-stepper-line" aria-hidden />}
          </div>
        )
      })}
    </nav>
  )
}
