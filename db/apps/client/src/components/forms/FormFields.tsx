import { useField } from "formik"
import type { InputHTMLAttributes, ReactNode } from "react"

type CommonProps = {
  name: string
  label: string
  required?: boolean
}

/* ---------- Editorial (underlined) field, used by Checkout, Profile, Address dialog ---------- */

type EditorialFieldProps = CommonProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "name"> & {
    colSpan?: 1 | 2
    helperText?: ReactNode
  }

export const EditorialFormField = ({
  name,
  label,
  required,
  colSpan = 1,
  helperText,
  className,
  disabled,
  ...inputProps
}: EditorialFieldProps) => {
  const [field, meta] = useField(name)
  const showError = meta.touched && Boolean(meta.error)
  const errorId = `${name}-error`

  return (
    <div
      className={[
        "aurelia-checkout-field",
        `aurelia-checkout-field--span-${colSpan}`,
        showError ? "is-error" : "",
        disabled ? "is-disabled" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <label htmlFor={name} className="aurelia-checkout-label">
        {label}
        {required && <span aria-hidden> *</span>}
      </label>
      <input
        {...inputProps}
        id={name}
        className="aurelia-checkout-input"
        aria-invalid={showError}
        aria-describedby={showError ? errorId : undefined}
        disabled={disabled}
        {...field}
        value={field.value ?? ""}
      />
      {showError ? (
        <p id={errorId} className="aurelia-form-field-error" role="alert">
          {meta.error}
        </p>
      ) : helperText ? (
        <p className="aurelia-form-field-help">{helperText}</p>
      ) : null}
    </div>
  )
}

/* ---------- Auth (split-screen) field, used by Login/Register ---------- */

type AuthFieldProps = CommonProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "name"> & {
    rightAdornment?: ReactNode
    inputClassName?: string
  }

export const AuthFormField = ({
  name,
  label,
  required,
  rightAdornment,
  inputClassName,
  ...inputProps
}: AuthFieldProps) => {
  const [field, meta] = useField(name)
  const showError = meta.touched && Boolean(meta.error)
  const errorId = `${name}-error`

  return (
    <div className="aurelia-auth-field">
      <label htmlFor={name} className="aurelia-auth-label">
        {label}
        {required && <span aria-hidden> *</span>}
      </label>
      <input
        {...inputProps}
        id={name}
        className={[
          "aurelia-auth-input",
          rightAdornment ? "has-toggle" : "",
          showError ? "is-error" : "",
          inputClassName ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={showError}
        aria-describedby={showError ? errorId : undefined}
        {...field}
        value={field.value ?? ""}
      />
      {rightAdornment}
      {showError && (
        <p id={errorId} className="aurelia-auth-error" role="alert">
          {meta.error}
        </p>
      )}
    </div>
  )
}
