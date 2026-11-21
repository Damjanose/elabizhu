import type { Product } from "@jewellery/types"

export type CatalogSort = "newest" | "priceAsc" | "priceDesc" | "featured"

/** Half-open bands: under20 = [0, 20), 20to50 = [20, 50), 50to100 = [50, 100), over100 = [100, ∞). */
export type PriceBand = "all" | "under20" | "20to50" | "50to100" | "over100"

export type CatalogFilters = {
  sort: CatalogSort
  inStockOnly: boolean
  priceBand: PriceBand
  query: string
}

export const defaultCatalogFilters: CatalogFilters = {
  sort: "newest",
  inStockOnly: false,
  priceBand: "all",
  query: "",
}

const PRICE_BANDS: Record<Exclude<PriceBand, "all">, { min: number; max: number }> = {
  under20: { min: 0, max: 20 },
  "20to50": { min: 20, max: 50 },
  "50to100": { min: 50, max: 100 },
  over100: { min: 100, max: Number.POSITIVE_INFINITY },
}

/** Lowercases, strips diacritics (ë -> e, ç -> c) and trims, so search matches regardless of accents. */
export const normalizeSearchText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()

const priceOf = (product: Product): number => {
  const value = Number(product.price)
  return Number.isFinite(value) ? value : 0
}

const timeOf = (value: string | null | undefined): number => {
  if (!value) return 0
  const time = Date.parse(value)
  return Number.isNaN(time) ? 0 : time
}

const newestFirst = (a: Product, b: Product): number =>
  timeOf(b.publishedAt ?? b.createdAt) - timeOf(a.publishedAt ?? a.createdAt)

/** Returns a new array; the input is never mutated. */
export const sortProducts = (products: Product[], sort: CatalogSort): Product[] => {
  const copy = [...products]
  switch (sort) {
    case "priceAsc":
      return copy.sort((a, b) => priceOf(a) - priceOf(b) || newestFirst(a, b))
    case "priceDesc":
      return copy.sort((a, b) => priceOf(b) - priceOf(a) || newestFirst(a, b))
    case "featured":
      return copy.sort((a, b) => Number(b.featured) - Number(a.featured) || newestFirst(a, b))
    case "newest":
    default:
      return copy.sort(newestFirst)
  }
}

const matchesBand = (product: Product, band: PriceBand): boolean => {
  if (band === "all") return true
  const { min, max } = PRICE_BANDS[band]
  const price = priceOf(product)
  return price >= min && price < max
}

/** Filters then sorts. Pure: returns a new array and never mutates the input. */
export const applyCatalogFilters = (products: Product[], filters: CatalogFilters): Product[] => {
  const query = normalizeSearchText(filters.query)
  const matching = products.filter(
    (product) =>
      (!filters.inStockOnly || product.stockQuantity > 0) &&
      matchesBand(product, filters.priceBand) &&
      (query === "" || normalizeSearchText(product.name).includes(query)),
  )
  return sortProducts(matching, filters.sort)
}

/** Number of active narrowing filters (price band and in-stock). Sort and search are not counted. */
export const countActiveFilters = (filters: Pick<CatalogFilters, "priceBand" | "inStockOnly">): number =>
  (filters.priceBand !== "all" ? 1 : 0) + (filters.inStockOnly ? 1 : 0)
