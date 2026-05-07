import type { ReactNode } from "react"

type AuthShellProps = {
  imageUrl: string
  imageAlt?: string
  overlayHeadline: string
  overlaySubcopy: string
  children: ReactNode
}

export const AuthShell = ({
  imageUrl,
  imageAlt,
  overlayHeadline,
  overlaySubcopy,
  children,
}: AuthShellProps) => (
  <div className="aurelia-auth-page">
    <div className="aurelia-auth-visual">
      <img src={imageUrl} alt={imageAlt ?? ""} loading="lazy" />
      <div aria-hidden className="aurelia-auth-visual-overlay" />
      <div className="aurelia-auth-visual-content">
        <h2 className="aurelia-auth-visual-title">{overlayHeadline}</h2>
        <p className="aurelia-auth-visual-copy">{overlaySubcopy}</p>
      </div>
    </div>
    <div className="aurelia-auth-pane">
      <div className="aurelia-auth-form">{children}</div>
    </div>
  </div>
)
