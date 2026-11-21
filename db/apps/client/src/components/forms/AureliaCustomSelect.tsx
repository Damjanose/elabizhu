import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useI18n } from "../../i18n"

export type AureliaSelectOption = { value: string; label: string }

type PanelPos = { top: number; left: number; width: number; maxHeight: number }

type Props = {
  id: string
  value: string
  onChange: (value: string) => void
  options: AureliaSelectOption[]
  /** Shown when `value` is empty or does not match any option */
  placeholder?: string
  disabled?: boolean
  variant?: "default" | "compact"
  "aria-label"?: string
}

export const AureliaCustomSelect = ({
  id,
  value,
  onChange,
  options,
  placeholder: placeholderProp,
  disabled,
  variant = "default",
  "aria-label": ariaLabel,
}: Props) => {
  const { t } = useI18n()
  const placeholder = placeholderProp ?? t("account.select.placeholder")
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const [panelPos, setPanelPos] = useState<PanelPos | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLUListElement>(null)
  const listId = useId()

  const resolvedLabel = options.find((o) => o.value === value)?.label
  const showPlaceholder = value === "" || resolvedLabel === undefined
  const triggerText = showPlaceholder ? placeholder : resolvedLabel

  const updatePanelPos = useCallback(() => {
    const el = rootRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const gap = 4
    const margin = 12
    const spaceBelow = window.innerHeight - r.bottom - gap - margin
    const maxH = Math.min(280, Math.max(100, spaceBelow))
    setPanelPos({ top: r.bottom + gap, left: r.left, width: r.width, maxHeight: maxH })
  }, [])

  useEffect(() => {
    if (!open) return
    const idx = options.findIndex((o) => o.value === value)
    setHighlightIndex(idx >= 0 ? idx : 0)
  }, [open, value, options])

  useLayoutEffect(() => {
    if (!open) {
      setPanelPos(null)
      return
    }
    updatePanelPos()
    window.addEventListener("resize", updatePanelPos)
    window.addEventListener("scroll", updatePanelPos, true)
    return () => {
      window.removeEventListener("resize", updatePanelPos)
      window.removeEventListener("scroll", updatePanelPos, true)
    }
  }, [open, updatePanelPos])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  const selectOption = useCallback(
    (v: string) => {
      onChange(v)
      setOpen(false)
    },
    [onChange],
  )

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault()
      setOpen(true)
      return
    }
    if (!open) return
    if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, options.length - 1))
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      const opt = options[highlightIndex]
      if (opt) selectOption(opt.value)
    }
    if (e.key === "Tab") setOpen(false)
  }

  const panel = open && panelPos && (
    <ul
      ref={panelRef}
      id={listId}
      className="aurelia-select-panel aurelia-select-panel--portal"
      role="listbox"
      style={{
        top: panelPos.top,
        left: panelPos.left,
        width: panelPos.width,
        maxHeight: panelPos.maxHeight,
      }}
    >
      {options.map((opt, i) => (
        <li
          key={opt.value === "" ? "__empty__" : opt.value}
          role="option"
          aria-selected={opt.value === value}
          className={`aurelia-select-option${i === highlightIndex ? " is-highlighted" : ""}${opt.value === value ? " is-selected" : ""}`}
          onMouseEnter={() => setHighlightIndex(i)}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => selectOption(opt.value)}
        >
          <span className="aurelia-select-option__label">{opt.label}</span>
          {opt.value === value && (
            <span className="material-symbols-outlined aurelia-select-option__check" aria-hidden>
              check
            </span>
          )}
        </li>
      ))}
    </ul>
  )

  return (
    <div
      className={`aurelia-select-custom${variant === "compact" ? " aurelia-select-custom--compact" : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        id={id}
        className={`aurelia-select-trigger${variant === "compact" ? " aurelia-select-trigger--compact" : ""}`}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={`aurelia-select-trigger__text${showPlaceholder ? " is-placeholder" : ""}`}>
          {triggerText}
        </span>
        <span className="aurelia-select-trigger__chevron" aria-hidden>
          <span className="material-symbols-outlined">expand_more</span>
        </span>
      </button>
      {panel && createPortal(panel, document.body)}
    </div>
  )
}
