import { Link } from "react-router-dom"

export const NotFoundPage = () => (
  <section className="aurelia-error-page" aria-labelledby="not-found-title">
    <span className="aurelia-admin-kicker">Lost in the Atelier</span>
    <p className="aurelia-error-code" aria-hidden>
      404
    </p>
    <h1 id="not-found-title" className="aurelia-error-title">
      The page you’re looking for has been quietly retired.
    </h1>
    <p className="aurelia-error-copy">
      It may have been moved, renamed, or never quite existed. Allow us to guide you back to the
      collection.
    </p>
    <div className="aurelia-error-actions">
      <Link to="/" className="aurelia-error-cta aurelia-error-cta--primary">
        Return Home
      </Link>
      <Link to="/products" className="aurelia-error-cta aurelia-error-cta--secondary">
        Browse Collections
      </Link>
    </div>
    <span className="aurelia-error-rule" aria-hidden />
    <p className="aurelia-error-meta">
      Need assistance? Reach our concierge at{" "}
      <a href="mailto:atelier@aurelia.com">atelier@aurelia.com</a>
    </p>
  </section>
)
