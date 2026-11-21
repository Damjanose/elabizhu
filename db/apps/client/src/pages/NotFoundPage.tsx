import { Link } from "react-router-dom"
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "../data/instagram"
import { useI18n } from "../i18n"

export const NotFoundPage = () => {
  const { t } = useI18n()

  return (
    <section className="aurelia-error-page" aria-labelledby="not-found-title">
      <span className="aurelia-admin-kicker">{t("catalog.notFound.kicker")}</span>
      <p className="aurelia-error-code" aria-hidden>
        404
      </p>
      <h1 id="not-found-title" className="aurelia-error-title">
        {t("catalog.notFound.title")}
      </h1>
      <p className="aurelia-error-copy">{t("catalog.notFound.copy")}</p>
      <div className="aurelia-error-actions">
        <Link to="/" className="aurelia-error-cta aurelia-error-cta--primary">
          {t("catalog.action.returnHome")}
        </Link>
        <Link to="/products" className="aurelia-error-cta aurelia-error-cta--secondary">
          {t("catalog.action.browseCollections")}
        </Link>
      </div>
      <span className="aurelia-error-rule" aria-hidden />
      <p className="aurelia-error-meta">
        {t("catalog.support.assist")}{" "}
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">@{INSTAGRAM_HANDLE}</a>
      </p>
    </section>
  )
}
