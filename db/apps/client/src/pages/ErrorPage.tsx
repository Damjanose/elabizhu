import { Link } from "react-router-dom"
import { useI18n } from "../i18n"

type ErrorPageProps = {
  code?: string
  title?: string
  copy?: string
  onRetry?: () => void
}

export const ErrorPage = ({ code = "500", title, copy, onRetry }: ErrorPageProps) => {
  const { t } = useI18n()

  return (
    <section className="aurelia-error-page" aria-labelledby="error-title">
      <span className="aurelia-admin-kicker">{t("catalog.errorPage.kicker")}</span>
      <p className="aurelia-error-code" aria-hidden>
        {code}
      </p>
      <h1 id="error-title" className="aurelia-error-title">
        {title ?? t("catalog.errorPage.title")}
      </h1>
      <p className="aurelia-error-copy">{copy ?? t("catalog.errorPage.copy")}</p>
      <div className="aurelia-error-actions">
        <button
          type="button"
          className="aurelia-error-cta aurelia-error-cta--primary"
          onClick={onRetry ?? (() => window.location.reload())}
        >
          {t("catalog.action.tryAgain")}
        </button>
        <Link to="/" className="aurelia-error-cta aurelia-error-cta--secondary">
          {t("catalog.action.returnHome")}
        </Link>
      </div>
      <span className="aurelia-error-rule" aria-hidden />
      <p className="aurelia-error-meta">
        {t("catalog.support.assist")}{" "}
        <a href="mailto:atelier@aurelia.com">atelier@aurelia.com</a>
      </p>
    </section>
  )
}
