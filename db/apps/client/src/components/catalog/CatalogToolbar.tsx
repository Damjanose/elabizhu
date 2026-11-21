import { useEffect, useId, useRef, useState, type RefObject } from "react"
import { createPortal } from "react-dom"
import { useI18n, type TFunction } from "../../i18n"
import {
  countActiveFilters,
  type CatalogFilters,
  type CatalogSort,
  type PriceBand,
} from "../../lib/catalog-filters"
import "../../styles/catalog.css"

type CatalogToolbarProps = {
  filters: CatalogFilters
  onChange: (next: CatalogFilters) => void
  /** Products shown after filtering. Undefined while loading, which keeps the row height stable. */
  resultCount?: number
}

const SORT_OPTIONS: CatalogSort[] = ["newest", "priceAsc", "priceDesc", "featured"]
const PRICE_BANDS: PriceBand[] = ["all", "under20", "20to50", "50to100", "over100"]

const SORT_KEYS: Record<CatalogSort, string> = {
  newest: "catalog.toolbar.sortNewest",
  priceAsc: "catalog.toolbar.sortPriceAsc",
  priceDesc: "catalog.toolbar.sortPriceDesc",
  featured: "catalog.toolbar.sortFeatured",
}

const BAND_KEYS: Record<PriceBand, string> = {
  all: "catalog.sheet.band.all",
  under20: "catalog.sheet.band.under20",
  "20to50": "catalog.sheet.band.20to50",
  "50to100": "catalog.sheet.band.50to100",
  over100: "catalog.sheet.band.over100",
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const countLabel = (t: TFunction, count: number) =>
  t(count === 1 ? "catalog.toolbar.resultsOne" : "catalog.toolbar.resultsOther", { count })

/** Sort, search and filters for product listings. Controlled: state lives in the page. */
export const CatalogToolbar = ({ filters, onChange, resultCount }: CatalogToolbarProps) => {
  const { t } = useI18n()
  const [sheetOpen, setSheetOpen] = useState(false)
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const activeCount = countActiveFilters(filters)

  const update = (patch: Partial<CatalogFilters>) => onChange({ ...filters, ...patch })

  const closeSheet = () => setSheetOpen(false)

  return (
    <div className="eb-cat-toolbar" role="search">
      <div className="eb-cat-toolbar-row">
        <div className="eb-cat-search">
          <input
            type="search"
            value={filters.query}
            onChange={(event) => update({ query: event.target.value })}
            placeholder={t("catalog.toolbar.search")}
            aria-label={t("catalog.toolbar.search")}
            autoComplete="off"
            enterKeyHint="search"
          />
          {filters.query !== "" && (
            <button
              type="button"
              className="eb-cat-search-clear"
              onClick={() => update({ query: "" })}
              aria-label={t("catalog.toolbar.clearSearch")}
            >
              ×
            </button>
          )}
        </div>

        <label className="eb-cat-sr" htmlFor="eb-cat-sort">
          {t("catalog.toolbar.sort")}
        </label>
        <select
          id="eb-cat-sort"
          className="eb-cat-sort"
          value={filters.sort}
          onChange={(event) => update({ sort: event.target.value as CatalogSort })}
        >
          {SORT_OPTIONS.map((sort) => (
            <option key={sort} value={sort}>
              {t(SORT_KEYS[sort])}
            </option>
          ))}
        </select>

        <button
          ref={filterButtonRef}
          type="button"
          className="eb-cat-filter-btn"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          aria-label={
            activeCount > 0
              ? t("catalog.toolbar.filtersActive", { count: activeCount })
              : t("catalog.toolbar.filters")
          }
        >
          {t("catalog.toolbar.filters")}
          {activeCount > 0 && (
            <span className="eb-cat-badge" aria-hidden>
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <div className="eb-cat-toolbar-meta">
        <span className="eb-cat-count" role="status" aria-live="polite">
          {resultCount === undefined ? "" : countLabel(t, resultCount)}
        </span>
        <div className="eb-cat-inline-filters">
          <PriceBandChips
            value={filters.priceBand}
            onSelect={(priceBand) => update({ priceBand })}
            label={t("catalog.sheet.price")}
            t={t}
          />
          <StockToggle checked={filters.inStockOnly} onChange={(inStockOnly) => update({ inStockOnly })} t={t} />
        </div>
      </div>

      {sheetOpen &&
        createPortal(
          <FilterSheet
            filters={filters}
            onApply={(next) => onChange(next)}
            onClose={closeSheet}
            returnFocusTo={filterButtonRef}
            t={t}
          />,
          document.body,
        )}
    </div>
  )
}

type PriceBandChipsProps = {
  value: PriceBand
  onSelect: (band: PriceBand) => void
  label: string
  t: TFunction
}

const PriceBandChips = ({ value, onSelect, label, t }: PriceBandChipsProps) => {
  const groupId = useId()
  return (
    <div className="eb-cat-option-row" role="group" aria-labelledby={groupId}>
      <span id={groupId} className="eb-cat-sr">
        {label}
      </span>
      {PRICE_BANDS.map((band) => (
        <button
          key={band}
          type="button"
          className="eb-cat-band"
          aria-pressed={value === band}
          onClick={() => onSelect(band)}
        >
          {t(BAND_KEYS[band])}
        </button>
      ))}
    </div>
  )
}

type StockToggleProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  t: TFunction
}

const StockToggle = ({ checked, onChange, t }: StockToggleProps) => (
  <label className="eb-cat-switch">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span>{t("catalog.sheet.inStock")}</span>
  </label>
)

type FilterSheetProps = {
  filters: CatalogFilters
  onApply: (next: CatalogFilters) => void
  onClose: () => void
  returnFocusTo: RefObject<HTMLElement | null>
  t: TFunction
}

/** Mobile bottom sheet. Edits a draft that only applies on "Apply". */
const FilterSheet = ({ filters, onApply, onClose, returnFocusTo, t }: FilterSheetProps) => {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [draftBand, setDraftBand] = useState<PriceBand>(filters.priceBand)
  const [draftInStock, setDraftInStock] = useState(filters.inStockOnly)

  // Keep the latest close handler without re-running the focus effect on every render.
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const body = document.body
    const previousOverflow = body.style.overflow
    body.style.overflow = "hidden"

    const focusables = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])

    focusables()[0]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== "Tab") return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      const inside = dialogRef.current?.contains(active) ?? false
      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      body.style.overflow = previousOverflow
      returnFocusTo.current?.focus()
    }
  }, [returnFocusTo])

  return (
    <div
      className="eb-cat-sheet-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="eb-cat-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="eb-cat-sheet-head">
          <h2 id={titleId} className="eb-cat-sheet-title">
            {t("catalog.sheet.title")}
          </h2>
          <button type="button" className="eb-cat-sheet-close" onClick={onClose}>
            {t("catalog.sheet.close")}
          </button>
        </div>

        <div className="eb-cat-sheet-body">
          <div>
            <p className="eb-cat-sheet-label" id={`${titleId}-price`}>
              {t("catalog.sheet.price")}
            </p>
            <div className="eb-cat-option-row" role="group" aria-labelledby={`${titleId}-price`}>
              {PRICE_BANDS.map((band) => (
                <button
                  key={band}
                  type="button"
                  className="eb-cat-band"
                  aria-pressed={draftBand === band}
                  onClick={() => setDraftBand(band)}
                >
                  {t(BAND_KEYS[band])}
                </button>
              ))}
            </div>
          </div>

          <StockToggle checked={draftInStock} onChange={setDraftInStock} t={t} />
        </div>

        <div className="eb-cat-sheet-foot">
          <button
            type="button"
            className="eb-cat-pill eb-cat-pill--outline"
            onClick={() => {
              setDraftBand("all")
              setDraftInStock(false)
            }}
          >
            {t("catalog.sheet.reset")}
          </button>
          <button
            type="button"
            className="eb-cat-pill"
            onClick={() => {
              onApply({ ...filters, priceBand: draftBand, inStockOnly: draftInStock })
              onClose()
            }}
          >
            {t("catalog.sheet.apply")}
          </button>
        </div>
      </div>
    </div>
  )
}
