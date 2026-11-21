import { describe, expect, it } from "vitest"
import type { Product } from "@jewellery/types"
import { translate } from "../i18n"
import { badgeKey, badgeLabel, deriveDisplayBadge } from "./productBadges"

const en = (key: string) => translate("en", key)
const sq = (key: string) => translate("sq", key)

const baseProduct = (over: Partial<Product>): Product => ({
  id: "1",
  categoryId: "c",
  name: "Test",
  description: null,
  price: "10.00",
  isActive: true,
  stockQuantity: 10,
  lowStockThreshold: 5,
  urgencyBadge: "none",
  featured: false,
  publishedAt: null,
  images: [],
  videoUrl: null,
  createdAt: "",
  updatedAt: "",
  ...over,
})

describe("productBadges", () => {
  it("maps urgency values to translation keys", () => {
    expect(badgeKey("new")).toBe("catalog.badge.new")
    expect(badgeKey("low_stock")).toBe("catalog.badge.lowStock")
    expect(badgeKey("sold_out")).toBe("catalog.badge.soldOut")
    expect(badgeKey("none")).toBeNull()
  })

  it("labels urgency values in the requested language", () => {
    expect(badgeLabel("new", en)).toBe("New")
    expect(badgeLabel("low_stock", en)).toBe("Selling fast")
    expect(badgeLabel("sold_out", en)).toBe("Sold out")
    expect(badgeLabel("new", sq)).toBe("E re")
    expect(badgeLabel("none", en)).toBe("")
  })

  it("prioritizes sold out and low stock from quantities", () => {
    expect(deriveDisplayBadge(baseProduct({ stockQuantity: 0 }))).toBe("sold_out")
    expect(deriveDisplayBadge(baseProduct({ stockQuantity: 2, lowStockThreshold: 5 }))).toBe("low_stock")
  })

  it("shows new when stock healthy and flag set", () => {
    expect(deriveDisplayBadge(baseProduct({ urgencyBadge: "new", stockQuantity: 20, lowStockThreshold: 5 }))).toBe("new")
  })
})
