import { useState } from "react"
import { FiEye, FiEyeOff } from "react-icons/fi"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { AuthShell } from "../components/auth/AuthShell"
import { useAuth } from "../types/auth-context"
import { extractFieldErrors } from "../utils/form-errors"
import { sanitizeRedirect } from "../utils/post-auth-redirect"

const REGISTER_VISUAL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC2a5NvgT3nw6nbJt-1nTW555XAN_2nqzoDEJlxE1Buz1a9wIlJwjMBKBPE3SYoVCgjcmMk73lmQxuFIPqwNxY3OO9d7cXTWP24To_WNRtfKhh2Mzw2pXUzPEJFOlK86EIc9epl5o5RrjnxrczcCgdgUkr3E9iqmuy4I98xXxl_tM6vVN7fY3_Af7o-WArja1GKsU4YSxs18tr7BxcMR-mgBaKTCTHd3zN6l2rK9Ar3eqFZLpezmxsR0dKM6YYD3ELNN6tanVCUPw"

export const RegisterPage = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = sanitizeRedirect(searchParams.get("redirect")) ?? "/categories"
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [joinCircle, setJoinCircle] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const clearFieldError = (field: string) => {
    setError(null)
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      await register({ fullName, email, password })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const { fieldErrors: rawErrors, formError } = extractFieldErrors(err)
      const next: Record<string, string> = { ...rawErrors }
      if (rawErrors.fullName) {
        next.firstName = next.firstName ?? rawErrors.fullName
        delete next.fullName
      }
      setFieldErrors(next)
      setError(formError ?? "Could not create account")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      imageUrl={REGISTER_VISUAL}
      imageAlt="A jeweller's hands setting a stone, sunlit close-up of craftsmanship"
      overlayHeadline="Timeless Elegance."
      overlaySubcopy="Become part of an exclusive circle where fine craftsmanship meets soulful storytelling."
    >
      <h1 className="aurelia-auth-title">Create Account</h1>
      <p className="aurelia-auth-subtitle">
        Experience the art of fine jewellery through a personalized lens.
      </p>

      <form onSubmit={onSubmit} noValidate>
        <div className="aurelia-auth-fields">
          <div className="aurelia-auth-row">
            <div className="aurelia-auth-field">
              <label htmlFor="reg-first" className="aurelia-auth-label">
                First Name
              </label>
              <input
                id="reg-first"
                type="text"
                autoComplete="given-name"
                className={`aurelia-auth-input ${fieldErrors.firstName ? "is-error" : ""}`}
                placeholder="Evelyn"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  clearFieldError("firstName")
                }}
              />
              {fieldErrors.firstName && (
                <p className="aurelia-auth-error">{fieldErrors.firstName}</p>
              )}
            </div>

            <div className="aurelia-auth-field">
              <label htmlFor="reg-last" className="aurelia-auth-label">
                Last Name
              </label>
              <input
                id="reg-last"
                type="text"
                autoComplete="family-name"
                className={`aurelia-auth-input ${fieldErrors.lastName ? "is-error" : ""}`}
                placeholder="Aurelius"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value)
                  clearFieldError("lastName")
                }}
              />
              {fieldErrors.lastName && (
                <p className="aurelia-auth-error">{fieldErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="aurelia-auth-field">
            <label htmlFor="reg-email" className="aurelia-auth-label">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              className={`aurelia-auth-input ${fieldErrors.email ? "is-error" : ""}`}
              placeholder="evelyn@aurelia.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearFieldError("email")
              }}
            />
            {fieldErrors.email && <p className="aurelia-auth-error">{fieldErrors.email}</p>}
          </div>

          <div className="aurelia-auth-field">
            <label htmlFor="reg-password" className="aurelia-auth-label">
              Password
            </label>
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className={`aurelia-auth-input has-toggle ${fieldErrors.password ? "is-error" : ""}`}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                clearFieldError("password")
              }}
            />
            <button
              type="button"
              className="aurelia-auth-toggle"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
            </button>
            {fieldErrors.password && <p className="aurelia-auth-error">{fieldErrors.password}</p>}
          </div>

          <label className="aurelia-auth-checkbox" htmlFor="reg-newsletter">
            <input
              id="reg-newsletter"
              type="checkbox"
              checked={joinCircle}
              onChange={(e) => setJoinCircle(e.target.checked)}
            />
            <span>Join the Aurelia Circle for exclusive collections and journal entries.</span>
          </label>
        </div>

        {error && (
          <div role="alert" className="aurelia-auth-banner">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="aurelia-auth-submit"
          disabled={submitting}
          style={{ marginTop: "2rem" }}
        >
          {submitting ? "Creating Account…" : "Create Account"}
        </button>

        <p className="aurelia-auth-footnote">
          Already have an account?
          <Link
            to={
              redirectTo !== "/categories"
                ? `/login?redirect=${encodeURIComponent(redirectTo)}`
                : "/login"
            }
          >
            Sign In
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
