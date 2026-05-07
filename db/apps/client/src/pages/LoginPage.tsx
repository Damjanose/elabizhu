import { useState } from "react"
import { FiEye, FiEyeOff } from "react-icons/fi"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { AuthShell } from "../components/auth/AuthShell"
import { useAuth } from "../types/auth-context"
import { extractFieldErrors } from "../utils/form-errors"
import { sanitizeRedirect } from "../utils/post-auth-redirect"

const LOGIN_VISUAL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuANIPK2sA_DRxWB_X0cI9oci-WSe6NXAJqBeV5uM-oNM7loqG2k7g7pBlapLwp_wZ0OGa0R5npIpEr_XD2x6SU_bAp-g1C4KGl3UWFPuM8rO2rSEXdTBlWO_NA8AIjlf12oCTHnMehix8fRwglYRDYfBVhKfagn1YN0QkTILB3_eqtipyes0e1P19vkR6oMivth7PNQftjceEEOaZOXTFns8iInHoDjkLH2_WFlWb1Z8DfLkCbBl_DV6jrISOgov80h7lOFKCn4Gw"

export const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = sanitizeRedirect(searchParams.get("redirect")) ?? "/categories"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
      await login({ email, password })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const { fieldErrors: nextFieldErrors, formError } = extractFieldErrors(err)
      setFieldErrors(nextFieldErrors)
      setError(formError ?? "Invalid credentials")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      imageUrl={LOGIN_VISUAL}
      imageAlt="Model wearing layered Aurelia gold jewellery in soft afternoon light"
      overlayHeadline="Welcome Back."
      overlaySubcopy="Continue your journey through curated craftsmanship and quietly luxurious pieces."
    >
      <h1 className="aurelia-auth-title">Sign In</h1>
      <p className="aurelia-auth-subtitle">
        Step back into your private circle of curated collections and bespoke services.
      </p>

      <form onSubmit={onSubmit} noValidate>
        <div className="aurelia-auth-fields">
          <div className="aurelia-auth-field">
            <label htmlFor="login-email" className="aurelia-auth-label">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className={`aurelia-auth-input ${fieldErrors.email ? "is-error" : ""}`}
              placeholder="you@aurelia.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearFieldError("email")
              }}
            />
            {fieldErrors.email && <p className="aurelia-auth-error">{fieldErrors.email}</p>}
          </div>

          <div className="aurelia-auth-field">
            <label htmlFor="login-password" className="aurelia-auth-label">
              Password
            </label>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`aurelia-auth-input has-toggle ${fieldErrors.password ? "is-error" : ""}`}
              placeholder="••••••••"
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
          {submitting ? "Signing In…" : "Sign In"}
        </button>

        <p className="aurelia-auth-footnote">
          New to Aurelia?
          <Link
            to={
              redirectTo !== "/categories"
                ? `/register?redirect=${encodeURIComponent(redirectTo)}`
                : "/register"
            }
          >
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
