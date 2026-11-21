import { describe, expect, it } from "vitest"
import { HOME_CATEGORIES, matchHomeCategory } from "./home-categories"

const api = [
  { id: "c1", name: "Rings" },
  { id: "c2", name: "Byzylykë" },
  { id: "c3", name: "vathë" },
  { id: "c4", name: "GJERDANË" },
  { id: "c5", name: "Orë" },
]

describe("home categories", () => {
  it("defines the five home categories", () => {
    expect(HOME_CATEGORIES.map((c) => c.key)).toEqual(["rings", "bracelets", "earrings", "necklaces", "watches"])
  })

  it("matches API names case-insensitively in English and Albanian", () => {
    expect(matchHomeCategory("rings", api)?.id).toBe("c1")
    expect(matchHomeCategory("bracelets", api)?.id).toBe("c2")
    expect(matchHomeCategory("earrings", api)?.id).toBe("c3")
    expect(matchHomeCategory("necklaces", api)?.id).toBe("c4")
    expect(matchHomeCategory("watches", api)?.id).toBe("c5")
  })

  it("accepts the unaza alias for rings and returns undefined without a match", () => {
    expect(matchHomeCategory("rings", [{ id: "x", name: "Unaza" }])?.id).toBe("x")
    expect(matchHomeCategory("watches", [])).toBeUndefined()
  })
})
