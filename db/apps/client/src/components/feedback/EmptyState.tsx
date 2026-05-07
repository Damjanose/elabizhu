import type { ReactNode } from "react"
import { Link } from "react-router-dom"

export type EmptyStateVariant = "card" | "page" | "inline"
export type EmptyStateTone = "default" | "muted" | "danger"

type CtaButton = {
  to?: string
  href?: string
  onClick?: () => void
  label: string
  primary?: boolean
}

export type EmptyStateProps = {
  icon?: string
  kicker?: string
  title: string
  copy?: ReactNode
  cta?: CtaButton
  secondaryCta?: CtaButton
  variant?: EmptyStateVariant
  tone?: EmptyStateTone
  className?: string
}

const renderCta = (cta: CtaButton, kind: "primary" | "secondary") => {
  const className = `aurelia-empty-cta aurelia-empty-cta--${kind}`
  if (cta.to) {
    return (
      <Link to={cta.to} className={className}>
        {cta.label}
      </Link>
    )
  }
  if (cta.href) {
    return (
      <a href={cta.href} className={className}>
        {cta.label}
      </a>
    )
  }
  return (
    <button type="button" className={className} onClick={cta.onClick}>
      {cta.label}
    </button>
  )
}

export const EmptyState = ({
  icon,
  kicker,
  title,
  copy,
  cta,
  secondaryCta,
  variant = "card",
  tone = "default",
  className,
}: EmptyStateProps) => {
  const classes = [
    "aurelia-empty",
    `aurelia-empty--${variant}`,
    `aurelia-empty--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={classes} role="status">
      {icon && (
        <span className="material-symbols-outlined aurelia-empty-icon" aria-hidden>
          {icon}
        </span>
      )}
      {kicker && <span className="aurelia-empty-kicker">{kicker}</span>}
      <h2 className="aurelia-empty-title">{title}</h2>
      {copy && <p className="aurelia-empty-copy">{copy}</p>}
      {(cta || secondaryCta) && (
        <div className="aurelia-empty-actions">
          {cta && renderCta(cta, "primary")}
          {secondaryCta && renderCta(secondaryCta, "secondary")}
        </div>
      )}
    </div>
  )
}
