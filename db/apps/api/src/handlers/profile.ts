import type { Request, Response } from "express"
import { z } from "zod"
import * as profile from "../lib/profile.js"
import { me as fetchMe } from "../lib/auth.js"

const trimmedString = (max: number) => z.string().trim().min(1).max(max)
const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null))

const profileSchema = z.object({
  fullName: trimmedString(120),
  phone: optionalTrimmed(40),
})

const addressSchema = z.object({
  label: trimmedString(40),
  recipientName: trimmedString(120),
  line1: trimmedString(160),
  line2: optionalTrimmed(160),
  city: trimmedString(80),
  postalCode: trimmedString(20),
  country: trimmedString(80),
  phone: optionalTrimmed(40),
  isDefault: z.boolean().optional(),
})

const handleError = (res: Response, error: unknown) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: "Validation failed", issues: error.issues })
  }
  console.error(error)
  return res.status(500).json({ message: "Internal server error" })
}

export const updateProfile = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = profileSchema.parse(req.body)
    await profile.updateProfile(req.auth.userId, input)
    const user = await fetchMe(req.auth.userId)
    return res.json(user)
  } catch (error) {
    return handleError(res, error)
  }
}

export const listAddresses = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const data = await profile.listAddresses(req.auth.userId)
    return res.json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

export const createAddress = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = addressSchema.parse(req.body)
    const data = await profile.createAddress(req.auth.userId, input)
    return res.status(201).json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

export const updateAddress = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = addressSchema.parse(req.body)
    const data = await profile.updateAddress(req.auth.userId, req.params.id, input)
    if (!data) return res.status(404).json({ message: "Address not found" })
    return res.json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

export const deleteAddress = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const ok = await profile.deleteAddress(req.auth.userId, req.params.id)
    if (!ok) return res.status(404).json({ message: "Address not found" })
    return res.status(204).send()
  } catch (error) {
    return handleError(res, error)
  }
}

export const setDefaultAddress = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const data = await profile.setDefaultAddress(req.auth.userId, req.params.id)
    if (!data) return res.status(404).json({ message: "Address not found" })
    return res.json(data)
  } catch (error) {
    return handleError(res, error)
  }
}
