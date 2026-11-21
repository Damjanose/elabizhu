import { describe, expect, it } from "vitest"
import { accountMessages } from "./account"

describe("accountMessages", () => {
  it("has the same keys in sq and en", () => {
    const sq = Object.keys(accountMessages.sq).sort()
    const en = Object.keys(accountMessages.en).sort()
    expect(sq.length).toBeGreaterThan(0)
    expect(en).toEqual(sq)
  })

  it("has no empty translations", () => {
    for (const lang of ["sq", "en"] as const) {
      for (const [key, value] of Object.entries(accountMessages[lang])) {
        expect(value.trim(), `${lang} ${key}`).not.toBe("")
      }
    }
  })

  it("only uses the account prefix", () => {
    for (const key of Object.keys(accountMessages.sq)) {
      expect(key.startsWith("account.")).toBe(true)
    }
  })
})
