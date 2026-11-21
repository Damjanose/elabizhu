import { describe, expect, it } from "vitest"
import type { Product } from "@jewellery/types"
import {
  applyCatalogFilters,
  defaultCatalogFilters,
  normalizeSearchText,
  sortProducts,
} from "./catalog-filters"

const makeProduct = (overrides: Partial<Product> & { id: string }): Product => ({
  categoryId: "cat-1",
  name: overrides.id,
  description: null,
  price: "10.00",
  isActive: true,
  stockQuantity: 1,
  lowStockThreshold: 2,
  urgencyBadge: "none",
  featured: false,
  publishedAt: null,
  images: [],
  videoUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
})

const ids = (products: Product[]) => products.map((p) => p.id)

describe("sortProducts", () => {
  const products = [
    makeProduct({ id: "old", createdAt: "2025-01-01T00:00:00.000Z", price: "30.00" }),
    makeProduct({
      id: "new",
      createdAt: "2024-01-01T00:00:00.000Z",
      publishedAt: "2026-03-01T00:00:00.000Z",
      price: "5.50",
    }),
    makeProduct({ id: "feat", featured: true, createdAt: "2025-06-01T00:00:00.000Z", price: "100.00" }),
  ]

  it("sorts newest first using publishedAt, falling back to createdAt", () => {
    expect(ids(sortProducts(products, "newest"))).toEqual(["new", "feat", "old"])
  })

  it("sorts by price ascending and descending using numeric values", () => {
    expect(ids(sortProducts(products, "priceAsc"))).toEqual(["new", "old", "feat"])
    expect(ids(sortProducts(products, "priceDesc"))).toEqual(["feat", "old", "new"])
  })

  it("puts featured products first and keeps newest order inside each group", () => {
    expect(ids(sortProducts(products, "featured"))).toEqual(["feat", "new", "old"])
  })

  it("does not mutate the input array", () => {
    const copy = [...products]
    sortProducts(products, "priceAsc")
    expect(products).toEqual(copy)
  })
})

describe("applyCatalogFilters", () => {
  const products = [
    makeProduct({ id: "ring-a", name: "Unazë Argjendi", price: "15.00", stockQuantity: 3 }),
    makeProduct({ id: "necklace", name: "Varëse e Artë", price: "49.99", stockQuantity: 0 }),
    makeProduct({ id: "watch", name: "Orë Klasike", price: "120.00", stockQuantity: 2 }),
    makeProduct({ id: "bracelet", name: "Byzylyk", price: "20.00", stockQuantity: 1 }),
    makeProduct({ id: "earring", name: "Vathë", price: "99.99", stockQuantity: 5 }),
  ]

  it("returns everything in newest order with default filters", () => {
    const result = applyCatalogFilters(products, defaultCatalogFilters)
    expect(result).toHaveLength(products.length)
  })

  it("uses half-open price bands: [0,20), [20,50), [50,100), [100, +inf)", () => {
    const band = (priceBand: "under20" | "20to50" | "50to100" | "over100") =>
      ids(applyCatalogFilters(products, { ...defaultCatalogFilters, priceBand }))
    expect(band("under20")).toEqual(["ring-a"])
    expect(band("20to50").sort()).toEqual(["bracelet", "necklace"].sort())
    expect(band("50to100")).toEqual(["earring"])
    expect(band("over100")).toEqual(["watch"])
  })

  it("keeps only in-stock products when inStockOnly is set", () => {
    const result = applyCatalogFilters(products, { ...defaultCatalogFilters, inStockOnly: true })
    expect(ids(result)).not.toContain("necklace")
    expect(result).toHaveLength(4)
  })

  it("matches the query case-insensitively and ignoring diacritics", () => {
    const find = (query: string) => ids(applyCatalogFilters(products, { ...defaultCatalogFilters, query }))
    expect(find("unaze")).toEqual(["ring-a"])
    expect(find("UNAZË")).toEqual(["ring-a"])
    expect(find("varese")).toEqual(["necklace"])
    expect(find("   ")).toHaveLength(products.length)
    expect(find("nuk-ekziston")).toEqual([])
  })

  it("combines filters and sorts the result", () => {
    const result = applyCatalogFilters(products, {
      sort: "priceDesc",
      inStockOnly: true,
      priceBand: "over100",
      query: "",
    })
    expect(ids(result)).toEqual(["watch"])
  })

  it("never mutates the input", () => {
    const copy = [...products]
    applyCatalogFilters(products, { ...defaultCatalogFilters, sort: "priceAsc" })
    expect(products).toEqual(copy)
  })
})

describe("normalizeSearchText", () => {
  it("lowercases, strips diacritics and trims", () => {
    expect(normalizeSearchText("  Çelësi Ë  ")).toBe("celesi e")
  })
})
