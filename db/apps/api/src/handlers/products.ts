import type { Request, Response } from "express"
import { z } from "zod"
import * as products from "../lib/products.js"

const urgency = z.enum(["new", "low_stock", "sold_out", "none"])

const createSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.string().min(1),
  stockQuantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  urgencyBadge: urgency.optional(),
  featured: z.boolean().optional(),
  imageUrls: z.array(z.string().min(1)).optional(),
  videoUrl: z.string().min(1).nullable().optional(),
})

const updateSchema = z.object({
  categoryId: z.string().uuid().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  urgencyBadge: urgency.optional(),
  featured: z.boolean().optional(),
  imageUrls: z.array(z.string().min(1)).optional(),
  videoUrl: z.string().min(1).nullable().optional(),
})

export const list = async (req: Request, res: Response) => {
  const featured = req.query.featured === "true"
  const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined
  const data = await products.listProducts({
    featured: featured || undefined,
    categoryId: categoryId && categoryId.length > 0 ? categoryId : undefined,
  })
  return res.json(data)
}

const adminListSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  categoryId: z.string().uuid().optional(),
  urgencyBadge: urgency.optional(),
  featured: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  includeInactive: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
})

export const adminList = async (req: Request, res: Response) => {
  try {
    const parsed = adminListSchema.parse(req.query)
    const data = await products.listProductsAdmin({
      q: parsed.q && parsed.q.length > 0 ? parsed.q : undefined,
      page: parsed.page,
      limit: parsed.limit,
      categoryId: parsed.categoryId,
      urgencyBadge: parsed.urgencyBadge,
      featured: parsed.featured,
      includeInactive: parsed.includeInactive,
    })
    return res.json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

export const getById = async (req: Request, res: Response) => {
  const data = await products.getProduct(req.params.id)
  if (!data) {
    return res.status(404).json({ message: "Product not found" })
  }

  return res.json(data)
}

export const listByCategory = async (req: Request, res: Response) => {
  const data = await products.listProductsByCategory(req.params.id)
  return res.json(data)
}

export const recommendations = async (req: Request, res: Response) => {
  const rawLimit = typeof req.query.limit === "string" ? Number(req.query.limit) : NaN
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 24) : 8
  const data = await products.listRecommendations(req.params.id, limit)
  return res.json(data)
}

export const create = async (req: Request, res: Response) => {
  try {
    const input = createSchema.parse(req.body)
    const data = await products.createProduct(input)
    return res.status(201).json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

export const update = async (req: Request, res: Response) => {
  try {
    const input = updateSchema.parse(req.body)
    const data = await products.updateProduct(req.params.id, input)
    if (!data) {
      return res.status(404).json({ message: "Product not found" })
    }

    return res.json(data)
  } catch (error) {
    return handleError(res, error)
  }
}

export const remove = async (req: Request, res: Response) => {
  const result = await products.removeProduct(req.params.id)
  if (Number(result.numDeletedRows ?? 0) < 1) {
    return res.status(404).json({ message: "Product not found" })
  }

  return res.status(204).send()
}

const handleError = (res: Response, error: unknown) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: "Validation failed", issues: error.issues })
  }

  console.error(error)
  return res.status(500).json({ message: "Internal server error" })
}
