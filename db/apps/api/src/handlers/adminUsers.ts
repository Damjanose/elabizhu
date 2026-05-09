import type { Request, Response } from "express"
import { z } from "zod"
import type { PermissionName } from "@jewellery/types"
import * as adminUsers from "../lib/adminUsers.js"

const permissionNames = [
  "admin",
  "product.read",
  "product.write",
  "category.read",
  "category.write",
  "order.read",
  "order.write",
] as const satisfies readonly PermissionName[]

const activeSchema = z.object({
  isActive: z.boolean(),
})

const permissionsSchema = z.object({
  permissions: z.array(z.enum(permissionNames)),
})

export const list = async (_req: Request, res: Response) => {
  try {
    const data = await adminUsers.listUsers()
    return res.json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

export const setActive = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = activeSchema.parse(req.body)
    const data = await adminUsers.setUserActive(req.auth.userId, req.params.id, input.isActive)
    if (!data) return res.status(404).json({ message: "User not found" })
    return res.json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

export const setPermissions = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = permissionsSchema.parse(req.body)
    const data = await adminUsers.updateUserPermissions(req.auth.userId, req.params.id, input.permissions)
    if (!data) return res.status(404).json({ message: "User not found" })
    return res.json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

const handleError = (res: Response, error: unknown) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: "Validation failed", issues: error.issues })
  }

  if (error instanceof Error && error.message.startsWith("Cannot")) {
    return res.status(400).json({ message: error.message })
  }

  if (error instanceof Error && error.message.startsWith("Unknown permission:")) {
    return res.status(400).json({ message: error.message })
  }

  console.error(error)
  return res.status(500).json({ message: "Internal server error" })
}
