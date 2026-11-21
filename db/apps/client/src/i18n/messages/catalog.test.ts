import { describe, expect, it } from "vitest"
import { catalogMessages } from "./catalog"

describe("catalogMessages", () => {
  it("has the same keys in sq and en, with no empty values", () => {
    const sqKeys = Object.keys(catalogMessages.sq).sort()
    const enKeys = Object.keys(catalogMessages.en).sort()
    expect(sqKeys).toEqual(enKeys)
    expect(sqKeys.length).toBeGreaterThan(0)
    for (const key of sqKeys) {
      expect(catalogMessages.sq[key], key).toBeTruthy()
      expect(catalogMessages.en[key], key).toBeTruthy()
    }
  })

  it("provides singular and plural forms for result counts", () => {
    for (const lang of ["sq", "en"] as const) {
      expect(catalogMessages[lang]["catalog.toolbar.resultsOne"], lang).toBeTruthy()
      expect(catalogMessages[lang]["catalog.toolbar.resultsOther"], lang).toBeTruthy()
    }
  })
})
