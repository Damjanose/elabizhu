import { describe, expect, it } from "vitest"
import { translate } from "./index"

describe("translate", () => {
  it("returns the key when missing", () => {
    expect(translate("sq", "nope.key")).toBe("nope.key")
  })
})
