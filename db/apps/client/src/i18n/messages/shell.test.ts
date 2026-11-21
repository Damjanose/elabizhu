import { describe, expect, it } from "vitest"
import { shellMessages } from "./shell"

describe("shellMessages", () => {
  it("has the same keys in sq and en", () => {
    const sq = Object.keys(shellMessages.sq).sort()
    const en = Object.keys(shellMessages.en).sort()
    expect(sq.length).toBeGreaterThan(0)
    expect(en).toEqual(sq)
  })

  it("has no empty translations", () => {
    for (const lang of ["sq", "en"] as const) {
      for (const [key, value] of Object.entries(shellMessages[lang])) {
        expect(value.trim(), `${lang} ${key}`).not.toBe("")
      }
    }
  })

  it("only uses the shell prefix", () => {
    for (const key of Object.keys(shellMessages.sq)) {
      expect(key.startsWith("shell.")).toBe(true)
    }
  })
})
