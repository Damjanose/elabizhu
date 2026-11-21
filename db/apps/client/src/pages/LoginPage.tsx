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
import { useI18n, type TFunction } from "../i18n"

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

const makeLoginSchema = (t: TFunction) =>
  Yup.object({
    email: Yup.string()
      .trim()
      .required(t("account.validation.emailRequired"))
      .email(t("account.validation.emailInvalid")),
    password: Yup.string().required(t("account.validation.passwordRequired")),
  })

export const LoginPage = () => {
  const { t } = useI18n()
  const loginSchema = makeLoginSchema(t)
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
      successToast(t("account.login.welcomeToast"))
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const { fieldErrors, formError: nextFormError } = extractFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) {
        helpers.setErrors(fieldErrors)
      }
      const message = nextFormError ?? t("account.login.invalidCredentials")
      setFormError(message)
      errorToast(message)
    } finally {
      helpers.setSubmitting(false)
    }
  }

  return (
    <AuthShell
      imageUrl={LOGIN_VISUAL}
      imageAlt={t("account.login.visualAlt")}
      overlayHeadline={t("account.login.overlayHeadline")}
      overlaySubcopy={t("account.login.overlaySubcopy")}
    >
      <h1 className="aurelia-auth-title">{t("account.login.title")}</h1>
      <p className="aurelia-auth-subtitle">{t("account.login.subtitle")}</p>

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
                  label={t("account.field.emailAddress")}
                  type="email"
                  autoComplete="email"
                  placeholder="you@aurelia.com"
                  required
                />

                <AuthFormField
                  name="password"
                  label={t("account.field.password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  rightAdornment={
                    <button
                      type="button"
                      className="aurelia-auth-toggle"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? t("account.password.hide") : t("account.password.show")}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                    </button>
                  }
                />
              </div>

              {(formError || showInvalidBanner) && (
                <div role="alert" className="aurelia-auth-banner">
                  {formError ?? t("account.validation.fixFields")}
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
                {isSubmitting ? t("account.login.submitting") : t("account.login.submit")}
              </motion.button>

            </Form>
          )
        }}
      </Formik>
    </AuthShell>
  )
}
