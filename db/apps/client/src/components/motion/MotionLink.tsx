import { motion } from "motion/react"
import { Link } from "react-router-dom"
import { transition } from "../../lib/motion"

export const MotionLink = motion(Link)

export const linkPressProps = {
  whileHover: { scale: 1.02, y: -1 },
  whileTap: { scale: 0.97 },
  transition: transition.quick,
} as const
