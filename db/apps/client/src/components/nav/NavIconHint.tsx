import type { ReactElement } from "react"

type NavIconHintProps = {
  label: string
  children: ReactElement
}

export const NavIconHint = ({ label, children }: NavIconHintProps) => (
  <span className="aurelia-nav-icon-hint">
    {children}
    <span className="aurelia-nav-icon-hint-label" role="tooltip" aria-hidden="true">
      {label}
    </span>
  </span>
)
