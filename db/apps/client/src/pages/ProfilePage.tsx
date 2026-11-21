import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { isAxiosError } from "axios"
import { Formik, Form, useFormikContext, type FormikHelpers } from "formik"
import * as Yup from "yup"
import type { Address, AddressInput, User } from "@jewellery/types"
import { useAuth } from "../types/auth-context"
import { useQueryLoadState } from "../hooks/useQueryLoadState"
import { queryKeys } from "../lib/query-keys"
import { queryTiming } from "../lib/query-client"
import { EmptyState } from "../components/feedback/EmptyState"
import { EditorialFormField } from "../components/forms/FormFields"
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  setDefaultAddress,
  updateAddress,
  updateProfile,
} from "../services/profile"
import { errorToast, successToast, toastFromError } from "../utils/toast"
import { useI18n, type TFunction } from "../i18n"

const EMPTY_ADDRESS: AddressInput = {
  label: "Home",
  recipientName: "",
  line1: "",
  line2: "",
  city: "",
  postalCode: "",
  country: "United Kingdom",
  phone: "",
  isDefault: false,
}

const extractMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    return data?.message ?? error.message ?? fallback
  }
  return error instanceof Error ? error.message : fallback
}

export const ProfilePage = () => {
  const { t } = useI18n()
  const { user, accessToken } = useAuth()
  const queryClient = useQueryClient()

  const addressesQuery = useQuery({
    queryKey: queryKeys.me.addresses(),
    queryFn: fetchAddresses,
    enabled: !!accessToken,
    staleTime: queryTiming.sessionStaleTime,
  })
  const { showSkeleton: addressesLoading } = useQueryLoadState(addressesQuery)

  return (
    <section className="aurelia-profile-shell">
      <Link to="/account" className="aurelia-profile-back">
        <span className="material-symbols-outlined" aria-hidden>chevron_left</span>
        <span>{t("account.common.backToAccount")}</span>
      </Link>

      <header className="aurelia-profile-hero">
        <span className="aurelia-profile-kicker">Personal Atelier</span>
        <h1 className="aurelia-profile-title">{t("account.profile.title")}</h1>
        <p className="aurelia-profile-sub">{t("account.profile.sub")}</p>
      </header>

      <div className="aurelia-profile-grid">
        <ProfileForm user={user} />
        <AddressBook
          addresses={addressesQuery.data ?? []}
          isLoading={addressesLoading}
          isError={addressesQuery.isError}
          onRefetch={() => void addressesQuery.refetch()}
          onChange={() => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.me.addresses() })
          }}
        />
      </div>
    </section>
  )
}

/* ---------------- Profile form ---------------- */

type ProfileValues = {
  fullName: string
  phone: string
}

const makeProfileSchema = (t: TFunction) =>
  Yup.object({
    fullName: Yup.string().trim().required(t("account.validation.fullNameRequired")),
    phone: Yup.string()
      .trim()
      .matches(/^[+0-9\s().-]*$/u, t("account.validation.phoneChars"))
      .max(40, t("account.validation.phoneTooLong")),
  })

const ProfileForm = ({ user }: { user: User | null }) => {
  const { t } = useI18n()
  const profileSchema = makeProfileSchema(t)
  const queryClient = useQueryClient()
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const initial = useMemo<ProfileValues>(
    () => ({
      fullName: user?.fullName ?? "",
      phone: user?.phone ?? "",
    }),
    [user],
  )

  const m = useMutation({
    mutationFn: updateProfile,
    onSuccess: (next) => {
      setSuccess(true)
      queryClient.setQueryData(["auth", "me"], next)
      window.setTimeout(() => setSuccess(false), 2500)
      successToast(t("account.profile.updated"))
    },
  })

  const handleSubmit = async (values: ProfileValues, helpers: FormikHelpers<ProfileValues>) => {
    setFormError(null)
    setSuccess(false)
    try {
      await m.mutateAsync({
        fullName: values.fullName.trim(),
        phone: values.phone.trim() || null,
      })
    } catch (err) {
      const message = extractMessage(err, t("account.profile.saveError"))
      setFormError(message)
      errorToast(message)
    } finally {
      helpers.setSubmitting(false)
    }
  }

  return (
    <article className="aurelia-profile-card">
      <header className="aurelia-profile-card-head">
        <h2 className="aurelia-profile-card-title">{t("account.profile.personalTitle")}</h2>
        <span className="material-symbols-outlined aurelia-profile-card-icon" aria-hidden>
          person
        </span>
      </header>

      <Formik
        initialValues={initial}
        enableReinitialize
        validationSchema={profileSchema}
        onSubmit={handleSubmit}
        validateOnBlur
        validateOnChange
      >
        {({ isSubmitting, submitCount, isValid }) => {
          const showInvalidBanner = !formError && submitCount > 0 && !isValid

          return (
            <Form className="aurelia-profile-form" noValidate>
              <div className="aurelia-profile-fields">
                <EditorialFormField
                  name="fullName"
                  label={t("account.field.fullName")}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  colSpan={2}
                  required
                />
                <DisabledEmailField email={user?.email ?? ""} />
                <EditorialFormField
                  name="phone"
                  label={t("account.field.phone")}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+44 20 1234 5678"
                />
              </div>

              {(formError || showInvalidBanner) && (
                <div className="aurelia-profile-error" role="alert">
                  <span className="material-symbols-outlined" aria-hidden>error</span>
                  <span>
                    {formError ?? t("account.validation.fixFields")}
                  </span>
                </div>
              )}

              <div className="aurelia-profile-form-actions">
                {success && (
                  <span className="aurelia-profile-success" role="status">
                    <span className="material-symbols-outlined" aria-hidden>check_circle</span>
                    {t("account.profile.updated")}
                  </span>
                )}
                <SubmitOnceFullyTouched isSubmitting={isSubmitting} />
              </div>
            </Form>
          )
        }}
      </Formik>
    </article>
  )
}

const DisabledEmailField = ({ email }: { email: string }) => {
  const { t } = useI18n()
  return (
    <div className="aurelia-checkout-field aurelia-checkout-field--span-1 is-disabled">
      <label className="aurelia-checkout-label">{t("account.field.email")}</label>
      <input
        className="aurelia-checkout-input"
        type="email"
        value={email}
        readOnly
        disabled
        aria-label={t("account.profile.emailReadOnlyAria")}
      />
      <p className="aurelia-form-field-help">{t("account.profile.emailHelp")}</p>
    </div>
  )
}

const SubmitOnceFullyTouched = ({ isSubmitting }: { isSubmitting: boolean }) => {
  const { t } = useI18n()
  const { values, setTouched, validateForm } = useFormikContext<Record<string, unknown>>()
  return (
    <button
      type="submit"
      className="aurelia-profile-submit"
      disabled={isSubmitting}
      onClick={() => {
        const touched = Object.keys(values).reduce<Record<string, boolean>>((acc, key) => {
          acc[key] = true
          return acc
        }, {})
        void setTouched(touched, true)
        void validateForm()
      }}
    >
      {isSubmitting ? t("account.common.saving") : t("account.profile.save")}
    </button>
  )
}

/* ---------------- Address book ---------------- */

const AddressBook = ({
  addresses,
  isLoading,
  isError,
  onRefetch,
  onChange,
}: {
  addresses: Address[]
  isLoading: boolean
  isError: boolean
  onRefetch: () => void
  onChange: () => void
}) => {
  const { t, lang } = useI18n()
  const emptyAddress = useMemo<AddressInput>(
    () => ({ ...EMPTY_ADDRESS, label: t("account.placeholder.home") }),
    [lang],
  )
  const [editing, setEditing] = useState<{ mode: "create" } | { mode: "edit"; address: Address } | null>(null)

  const closeForm = () => setEditing(null)

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="aurelia-address-skeleton" aria-busy="true" aria-live="polite" aria-label={t("account.profile.loadingAddresses")}>
          {[0, 1].map((index) => (
            <div key={index} className="aurelia-address-skeleton-row aurelia-shimmer-block" />
          ))}
        </div>
      )
    }
    if (isError) {
      return (
        <EmptyState
          variant="inline"
          icon="error"
          tone="danger"
          title={t("account.profile.addressesError")}
          copy={t("account.common.tryAgainCopy")}
          cta={{ label: t("account.common.tryAgain"), onClick: onRefetch }}
        />
      )
    }
    if (addresses.length === 0) {
      return (
        <EmptyState
          variant="inline"
          icon="location_on"
          kicker={t("account.profile.emptyKicker")}
          title={t("account.profile.emptyTitle")}
          copy={t("account.profile.emptyCopy")}
          cta={{ label: t("account.profile.addAddress"), onClick: () => setEditing({ mode: "create" }) }}
        />
      )
    }
    return (
      <ul className="aurelia-address-list">
        {addresses.map((address) => (
          <AddressItem
            key={address.id}
            address={address}
            onEdit={() => setEditing({ mode: "edit", address })}
            onChange={onChange}
          />
        ))}
      </ul>
    )
  }

  return (
    <article className="aurelia-profile-card aurelia-profile-card--addresses">
      <header className="aurelia-profile-card-head">
        <h2 className="aurelia-profile-card-title">{t("account.profile.addressBookTitle")}</h2>
        <button
          type="button"
          className="aurelia-profile-add"
          onClick={() => setEditing({ mode: "create" })}
        >
          <span className="material-symbols-outlined" aria-hidden>add</span>
          <span>{t("account.profile.addAddress")}</span>
        </button>
      </header>

      {renderBody()}

      {editing && (
        <AddressDialog
          mode={editing.mode}
          initial={editing.mode === "edit" ? editing.address : emptyAddress}
          addressId={editing.mode === "edit" ? editing.address.id : undefined}
          onClose={closeForm}
          onSaved={() => {
            onChange()
            closeForm()
          }}
        />
      )}
    </article>
  )
}

const AddressItem = ({
  address,
  onEdit,
  onChange,
}: {
  address: Address
  onEdit: () => void
  onChange: () => void
}) => {
  const { t } = useI18n()
  const setDefault = useMutation({
    mutationFn: () => setDefaultAddress(address.id),
    onSuccess: () => {
      onChange()
      successToast(t("account.profile.defaultSet", { label: address.label }))
    },
    onError: (err) => toastFromError(err, t("account.profile.defaultError")),
  })
  const remove = useMutation({
    mutationFn: () => deleteAddress(address.id),
    onSuccess: () => {
      onChange()
      successToast(t("account.profile.removed", { label: address.label }))
    },
    onError: (err) => toastFromError(err, t("account.profile.removeError")),
  })

  const onRemove = () => {
    if (window.confirm(t("account.profile.confirmRemove", { label: address.label }))) {
      void remove.mutateAsync()
    }
  }

  return (
    <li className={`aurelia-address-card${address.isDefault ? " is-default" : ""}`}>
      <div className="aurelia-address-card-head">
        <div className="aurelia-address-card-label-wrap">
          <span className="aurelia-address-card-label">{address.label}</span>
          {address.isDefault && (
            <span className="aurelia-address-card-pill">{t("account.profile.defaultPill")}</span>
          )}
        </div>
        <span className="material-symbols-outlined aurelia-address-card-icon" aria-hidden>
          location_on
        </span>
      </div>

      <address className="aurelia-address-card-body">
        <p className="aurelia-address-card-recipient">{address.recipientName}</p>
        <p>{address.line1}</p>
        {address.line2 && <p>{address.line2}</p>}
        <p>
          {address.city}
          {address.postalCode ? `, ${address.postalCode}` : ""}
        </p>
        <p>{address.country}</p>
        {address.phone && <p className="aurelia-address-card-phone">{address.phone}</p>}
      </address>

      <div className="aurelia-address-card-actions">
        {!address.isDefault && (
          <button
            type="button"
            className="aurelia-address-card-link"
            onClick={() => void setDefault.mutateAsync()}
            disabled={setDefault.isPending}
          >
            {setDefault.isPending ? t("account.profile.settingDefault") : t("account.profile.setDefault")}
          </button>
        )}
        <button type="button" className="aurelia-address-card-link" onClick={onEdit}>
          {t("account.profile.edit")}
        </button>
        <button
          type="button"
          className="aurelia-address-card-link aurelia-address-card-link--danger"
          onClick={onRemove}
          disabled={remove.isPending}
        >
          {remove.isPending ? t("account.profile.removingLink") : t("account.profile.removeLink")}
        </button>
      </div>
    </li>
  )
}

/* ---------------- Address dialog (Formik) ---------------- */

type AddressFormValues = {
  label: string
  recipientName: string
  line1: string
  line2: string
  city: string
  postalCode: string
  country: string
  phone: string
  isDefault: boolean
}

const makeAddressSchema = (t: TFunction) =>
  Yup.object({
    label: Yup.string().trim().required(t("account.validation.labelRequired")).max(40, t("account.validation.labelTooLong")),
    recipientName: Yup.string().trim().required(t("account.validation.recipientRequired")).max(120),
    line1: Yup.string().trim().required(t("account.validation.line1Required")).max(160),
    line2: Yup.string().trim().max(160),
    city: Yup.string().trim().required(t("account.validation.cityRequired")).max(80),
    postalCode: Yup.string().trim().required(t("account.validation.postalCodeRequired")).max(20),
    country: Yup.string().trim().required(t("account.validation.countryRequired")).max(80),
    phone: Yup.string()
      .trim()
      .matches(/^[+0-9\s().-]*$/u, t("account.validation.phoneChars"))
      .max(40, t("account.validation.phoneTooLong")),
    isDefault: Yup.boolean(),
  })

const normalizeInitial = (initial: AddressInput | Address): AddressFormValues => ({
  label: initial.label,
  recipientName: initial.recipientName,
  line1: initial.line1,
  line2: initial.line2 ?? "",
  city: initial.city,
  postalCode: initial.postalCode,
  country: initial.country || "United Kingdom",
  phone: initial.phone ?? "",
  isDefault: "isDefault" in initial ? initial.isDefault === true : false,
})

const AddressDialog = ({
  mode,
  initial,
  addressId,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit"
  initial: AddressInput | Address
  addressId?: string
  onClose: () => void
  onSaved: () => void
}) => {
  const { t } = useI18n()
  const addressSchema = makeAddressSchema(t)
  const [formError, setFormError] = useState<string | null>(null)

  // Close on Escape
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  // Lock background scroll while open
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const initialValues = useMemo(() => normalizeInitial(initial), [initial])

  const save = useMutation({
    mutationFn: (payload: AddressInput) => {
      if (mode === "edit" && addressId) {
        return updateAddress(addressId, payload)
      }
      return createAddress(payload)
    },
    onSuccess: (saved) => {
      successToast(
        mode === "edit"
          ? t("account.profile.addressUpdated", { label: saved.label })
          : t("account.profile.addressAdded", { label: saved.label }),
      )
      onSaved()
    },
  })

  const handleSubmit = async (values: AddressFormValues, helpers: FormikHelpers<AddressFormValues>) => {
    setFormError(null)
    const payload: AddressInput = {
      label: values.label.trim(),
      recipientName: values.recipientName.trim(),
      line1: values.line1.trim(),
      line2: values.line2.trim() || null,
      city: values.city.trim(),
      postalCode: values.postalCode.trim(),
      country: values.country.trim(),
      phone: values.phone.trim() || null,
      isDefault: values.isDefault,
    }
    try {
      await save.mutateAsync(payload)
    } catch (err) {
      const message = extractMessage(err, t("account.profile.addressSaveError"))
      setFormError(message)
      errorToast(message)
    } finally {
      helpers.setSubmitting(false)
    }
  }

  return (
    <div
      className="aurelia-address-dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="aurelia-address-dialog-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <Formik
        initialValues={initialValues}
        validationSchema={addressSchema}
        onSubmit={handleSubmit}
        validateOnBlur
        validateOnChange
      >
        {({ values, setFieldValue, isSubmitting, submitCount, isValid, setTouched, validateForm }) => {
          const showInvalidBanner = !formError && submitCount > 0 && !isValid

          return (
            <Form className="aurelia-address-dialog" noValidate>
              <header className="aurelia-address-dialog-head">
                <div>
                  <span className="aurelia-profile-kicker">{t("account.profile.addressBookKicker")}</span>
                  <h2 id="aurelia-address-dialog-title" className="aurelia-address-dialog-title">
                    {mode === "edit" ? t("account.profile.editAddress") : t("account.profile.addAddress")}
                  </h2>
                </div>
                <button
                  type="button"
                  className="aurelia-address-dialog-close"
                  aria-label={t("account.common.close")}
                  onClick={onClose}
                >
                  <span className="material-symbols-outlined" aria-hidden>close</span>
                </button>
              </header>

              <div className="aurelia-profile-fields">
                <EditorialFormField
                  name="label"
                  label={t("account.field.label")}
                  placeholder={t("account.placeholder.home")}
                  required
                />
                <EditorialFormField
                  name="recipientName"
                  label={t("account.field.recipient")}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  required
                />
                <EditorialFormField
                  name="line1"
                  label={t("account.field.addressLine1")}
                  colSpan={2}
                  placeholder="123 Mayfair Terrace"
                  autoComplete="address-line1"
                  required
                />
                <EditorialFormField
                  name="line2"
                  label={t("account.field.addressLine2")}
                  colSpan={2}
                  placeholder={t("account.placeholder.addressLine2")}
                  autoComplete="address-line2"
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
                  name="country"
                  label={t("account.field.country")}
                  placeholder="United Kingdom"
                  autoComplete="country-name"
                  required
                />
                <EditorialFormField
                  name="phone"
                  label={t("account.field.phone")}
                  type="tel"
                  placeholder="+44 20 1234 5678"
                  autoComplete="tel"
                />
              </div>

              <label className="aurelia-address-dialog-default">
                <input
                  type="checkbox"
                  checked={values.isDefault}
                  onChange={(event) => void setFieldValue("isDefault", event.target.checked)}
                />
                <span>{t("account.profile.setDefaultDelivery")}</span>
              </label>

              {(formError || showInvalidBanner) && (
                <div className="aurelia-profile-error" role="alert">
                  <span className="material-symbols-outlined" aria-hidden>error</span>
                  <span>
                    {formError ?? t("account.validation.fixFields")}
                  </span>
                </div>
              )}

              <div className="aurelia-address-dialog-actions">
                <button type="button" className="aurelia-checkout-back" onClick={onClose}>
                  <span className="material-symbols-outlined" aria-hidden>chevron_left</span>
                  <span>{t("account.common.cancel")}</span>
                </button>
                <button
                  type="submit"
                  className="aurelia-profile-submit"
                  disabled={isSubmitting}
                  onClick={() => {
                    const touched = Object.keys(values).reduce<Record<string, boolean>>(
                      (acc, key) => {
                        acc[key] = true
                        return acc
                      },
                      {},
                    )
                    void setTouched(touched, true)
                    void validateForm()
                  }}
                >
                  {isSubmitting ? t("account.common.saving") : mode === "edit" ? t("account.profile.saveAddress") : t("account.profile.addAddress")}
                </button>
              </div>
            </Form>
          )
        }}
      </Formik>
    </div>
  )
}
