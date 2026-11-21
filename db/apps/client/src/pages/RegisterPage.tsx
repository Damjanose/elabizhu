import { useState } from "react"
import { Formik, Form, type FormikHelpers } from "formik"
import * as Yup from "yup"
import { FiEye, FiEyeOff } from "react-icons/fi"
import { motion } from "motion/react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { AuthShell } from "../components/auth/AuthShell"
import { transition } from "../lib/motion"
import { AuthFormField } from "../components/forms/FormFields"
import { useAuth } from "../types/auth-context"
import { extractFieldErrors } from "../utils/form-errors"
import { sanitizeRedirect } from "../utils/post-auth-redirect"
import { errorToast, successToast } from "../utils/toast"

const REGISTER_VISUAL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC2a5NvgT3nw6nbJt-1nTW555XAN_2nqzoDEJlxE1Buz1a9wIlJwjMBKBPE3SYoVCgjcmMk73lmQxuFIPqwNxY3OO9d7cXTWP24To_WNRtfKhh2Mzw2pXUzPEJFOlK86EIc9epl5o5RrjnxrczcCgdgUkr3E9iqmuy4I98xXxl_tM6vVN7fY3_Af7o-WArja1GKsU4YSxs18tr7BxcMR-mgBaKTCTHd3zN6l2rK9Ar3eqFZLpezmxsR0dKM6YYD3ELNN6tanVCUPw"

type RegisterValues = {
  firstName: string
  lastName: string
  email: string
  password: string
  joinCircle: boolean
}

const initialValues: RegisterValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  joinCircle: true,
}

const registerSchema = Yup.object({
  firstName: Yup.string().trim().required("First name is required"),
  lastName: Yup.string().trim().required("Last name is required"),
  email: Yup.string()
    .trim()
    .required("Email is required")
    .email("Please enter a valid email address"),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters"),
  joinCircle: Yup.boolean(),
})

export const RegisterPage = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = sanitizeRedirect(searchParams.get("redirect")) ?? "/categories"
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (values: RegisterValues, helpers: FormikHelpers<RegisterValues>) => {
    setFormError(null)
    try {
      const fullName = `${values.firstName.trim()} ${values.lastName.trim()}`.trim()
      await register({
        fullName,
        email: values.email.trim(),
        password: values.password,
      })
      successToast(`Welcome to ElaBizhu, ${values.firstName.trim()}`)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const { fieldErrors: rawErrors, formError: nextFormError } = extractFieldErrors(err)
      const next: Record<string, string> = { ...rawErrors }
      // Backend reports `fullName`; surface it on the firstName field instead.
      if (rawErrors.fullName) {
        next.firstName = next.firstName ?? rawErrors.fullName
        delete next.fullName
      }
      if (Object.keys(next).length > 0) {
        helpers.setErrors(next)
      }
      const message = nextFormError ?? "Could not create account"
      setFormError(message)
      errorToast(message)
    } finally {
      helpers.setSubmitting(false)
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

      <Formik
        initialValues={initialValues}
        validationSchema={registerSchema}
        onSubmit={handleSubmit}
        validateOnBlur
        validateOnChange
      >
        {({ values, setFieldValue, isSubmitting, submitCount, isValid }) => {
          const showInvalidBanner = !formError && submitCount > 0 && !isValid

          return (
            <Form noValidate>
              <div className="aurelia-auth-fields">
                <div className="aurelia-auth-row">
                  <AuthFormField
                    name="firstName"
                    label="First Name"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Evelyn"
                    required
                  />
                  <AuthFormField
                    name="lastName"
                    label="Last Name"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Aurelius"
                    required
                  />
                </div>

                <AuthFormField
                  name="email"
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  placeholder="evelyn@aurelia.com"
                  required
                />

                <AuthFormField
                  name="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
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

                <label className="aurelia-auth-checkbox" htmlFor="reg-newsletter">
                  <input
                    id="reg-newsletter"
                    type="checkbox"
                    checked={values.joinCircle}
                    onChange={(e) => void setFieldValue("joinCircle", e.target.checked)}
                  />
                  <span>Join the ElaBizhu Circle for exclusive collections and journal entries.</span>
                </label>
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
                {isSubmitting ? "Creating Account…" : "Create Account"}
              </motion.button>

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
            </Form>
          )
        }}
      </Formik>
    </AuthShell>
  )
}
