import type { Transition, Variants } from "motion/react"

export const motionDurations = {
  quick: 0.2,
  base: 0.35,
  slow: 0.55,
} as const

export const motionEase = [0.22, 1, 0.36, 1] as const

export const transition = {
  quick: { duration: motionDurations.quick, ease: motionEase } satisfies Transition,
  base: { duration: motionDurations.base, ease: motionEase } satisfies Transition,
  slow: { duration: motionDurations.slow, ease: motionEase } satisfies Transition,
  spring: { type: "spring", stiffness: 220, damping: 22, mass: 0.9 } satisfies Transition,
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: transition.base },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.base },
}

export const listStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
}

export const listItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: transition.base },
}

/** Default viewport for scroll-triggered reveals (whileInView) */
export const scrollRevealViewport = { once: true, amount: 0.15 as const }

export const reduceMotionQuery = "(prefers-reduced-motion: reduce)"

export const shouldReduceMotion = (matcher?: (query: string) => { matches: boolean }) => {
  const getMatchMedia = matcher ?? (typeof window !== "undefined" ? window.matchMedia.bind(window) : null)
  if (!getMatchMedia) return false
  return getMatchMedia(reduceMotionQuery).matches
}
