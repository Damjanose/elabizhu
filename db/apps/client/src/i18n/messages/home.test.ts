import { describe, expect, it } from "vitest"
import { homeMessages } from "./home"

describe("homeMessages", () => {
  it("has the same keys in sq and en, with no empty values", () => {
    const sqKeys = Object.keys(homeMessages.sq).sort()
    const enKeys = Object.keys(homeMessages.en).sort()
    expect(sqKeys).toEqual(enKeys)
    expect(sqKeys.length).toBeGreaterThan(0)
    for (const key of sqKeys) {
      expect(homeMessages.sq[key], key).toBeTruthy()
      expect(homeMessages.en[key], key).toBeTruthy()
    }
  })
})
