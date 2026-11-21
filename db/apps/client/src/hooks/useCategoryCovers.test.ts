import { describe, expect, it } from "vitest"
import type { Product } from "@jewellery/types"
import { buildCategoryCovers } from "./useCategoryCovers"

const p = (categoryId: string, urls: string[]): Product =>
  ({ id: Math.random().toString(), categoryId, images: urls.map((url, i) => ({ id: String(i), url, sortOrder: urls.length - i })) }) as unknown as Product

describe("buildCategoryCovers", () => {
  it("uses the first product that has an image, lowest sortOrder image", () => {
    const covers = buildCategoryCovers([p("a", []), p("a", ["x", "y"]), p("a", ["z"]), p("b", ["q"])])
    expect(covers.get("a")).toBe("y")
    expect(covers.get("b")).toBe("q")
  })
  it("returns an empty map without data", () => {
    expect(buildCategoryCovers(undefined).size).toBe(0)
  })
})
