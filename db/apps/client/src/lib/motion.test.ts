import { describe, expect, it } from "vitest"
import { reduceMotionQuery, shouldReduceMotion, transition } from "./motion"

describe("motion primitives", () => {
  it("keeps stable duration tokens", () => {
    expect(transition.quick.duration).toBe(0.2)
    expect(transition.base.duration).toBe(0.35)
    expect(transition.slow.duration).toBe(0.55)
  })

  it("uses reduced-motion media query", () => {
    expect(reduceMotionQuery).toBe("(prefers-reduced-motion: reduce)")
  })

  it("detects reduced motion when matcher returns true", () => {
    const reduced = shouldReduceMotion(() => ({ matches: true }))
    expect(reduced).toBe(true)
  })

  it("defaults to non-reduced motion without matcher", () => {
    expect(shouldReduceMotion()).toBe(false)
  })
})
