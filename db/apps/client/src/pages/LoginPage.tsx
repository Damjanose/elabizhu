import { useState } from "react"
import { Formik, Form, type FormikHelpers } from "formik"
import * as Yup from "yup"
import { FiEye, FiEyeOff } from "react-icons/fi"
import { motion } from "motion/react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { transition } from "../lib/motion"
import { AuthShell } from "../components/auth/AuthShell"
import { AuthFormField } from "../components/forms/FormFields"
import { useAuth } from "../types/auth-context"
import { extractFieldErrors } from "../utils/form-errors"
import { sanitizeRedirect } from "../utils/post-auth-redirect"
import { errorToast, successToast } from "../utils/toast"

// Demo admin (run db:seed): admin@example.com / Admin123!

const LOGIN_VISUAL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuANIPK2sA_DRxWB_X0cI9oci-WSe6NXAJqBeV5uM-oNM7loqG2k7g7pBlapLwp_wZ0OGa0R5npIpEr_XD2x6SU_bAp-g1C4KGl3UWFPuM8rO2rSEXdTBlWO_NA8AIjlf12oCTHnMehix8fRwglYRDYfBVhKfagn1YN0QkTILB3_eqtipyes0e1P19vkR6oMivth7PNQftjceEEOaZOXTFns8iInHoDjkLH2_WFlWb1Z8DfLkCbBl_DV6jrISOgov80h7lOFKCn4Gw"

type LoginValues = {
  email: string
  password: string
}

const initialValues: LoginValues = {
  email: "",
  password: "",
}

const loginSchema = Yup.object({
  email: Yup.string()
    .trim()
    .required("Email is required")
    .email("Please enter a valid email address"),
  password: Yup.string().required("Password is required"),
})

export const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = sanitizeRedirect(searchParams.get("redirect")) ?? "/categories"
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (values: LoginValues, helpers: FormikHelpers<LoginValues>) => {
    setFormError(null)
    try {
      await login({ email: values.email.trim(), password: values.password })
      successToast("Welcome back to Aurelia")
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const { fieldErrors, formError: nextFormError } = extractFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) {
        helpers.setErrors(fieldErrors)
      }
      const message = nextFormError ?? "Invalid credentials"
      setFormError(message)
      errorToast(message)
    } finally {
      helpers.setSubmitting(false)
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

      <Formik
        initialValues={initialValues}
        validationSchema={loginSchema}
        onSubmit={handleSubmit}
        validateOnBlur
        validateOnChange
      >
        {({ isSubmitting, submitCount, isValid }) => {
          // Surface a generic banner once the user attempts to submit but the form is invalid.
          const showInvalidBanner = !formError && submitCount > 0 && !isValid

          return (
            <Form noValidate>
              <div className="aurelia-auth-fields">
                <AuthFormField
                  name="email"
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  placeholder="you@aurelia.com"
                  required
                />

                <AuthFormField
                  name="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  rightAdornment={
                    <button
                      type="button"
                      className="aurelia-auth-toggle"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                    </button>
                  }
                />
              </div>

              {(formError || showInvalidBanner) && (
                <div role="alert" className="aurelia-auth-banner">
                  {formError ?? "Please fix the highlighted fields and try again."}
                </div>
              )}

              <motion.button
                type="submit"
                className="aurelia-auth-submit"
                disabled={isSubmitting}
                style={{ marginTop: "2rem" }}
                whileHover={isSubmitting ? undefined : { scale: 1.02, y: -1 }}
                whileTap={isSubmitting ? undefined : { scale: 0.97 }}
                transition={transition.quick}
              >
                {isSubmitting ? "Signing In…" : "Sign In"}
              </motion.button>

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
            </Form>
          )
        }}
      </Formik>
    </AuthShell>
  )
}
