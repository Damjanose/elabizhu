import { Link } from "react-router-dom"

type ErrorPageProps = {
  code?: string
  title?: string
  copy?: string
  onRetry?: () => void
}

export const ErrorPage = ({
  code = "500",
  title = "Something has come undone in the workshop.",
  copy = "An unexpected error interrupted our craft. Our team has been notified — please refresh, or return home and try again in a moment.",
  onRetry,
}: ErrorPageProps) => (
  <section className="aurelia-error-page" aria-labelledby="error-title">
    <span className="aurelia-admin-kicker">An Unexpected Pause</span>
    <p className="aurelia-error-code" aria-hidden>
      {code}
    </p>
    <h1 id="error-title" className="aurelia-error-title">
      {title}
    </h1>
    <p className="aurelia-error-copy">{copy}</p>
    <div className="aurelia-error-actions">
      <button
        type="button"
        className="aurelia-error-cta aurelia-error-cta--primary"
        onClick={onRetry ?? (() => window.location.reload())}
      >
        Try Again
      </button>
      <Link to="/" className="aurelia-error-cta aurelia-error-cta--secondary">
        Return Home
      </Link>
    </div>
    <span className="aurelia-error-rule" aria-hidden />
    <p className="aurelia-error-meta">
      Need assistance? Reach our concierge at{" "}
      <a href="mailto:atelier@aurelia.com">atelier@aurelia.com</a>
    </p>
  </section>
)
