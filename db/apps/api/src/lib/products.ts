import type { Selectable } from "kysely"
import type { ProductImagesTable } from "./db.js"
import { db } from "./db.js"
import { toProduct } from "./serializers.js"

const loadImagesForProducts = async (productIds: string[]) => {
  if (productIds.length === 0) return new Map<string, Selectable<ProductImagesTable>[]>()
  const images = await db
    .selectFrom("product_images")
    .selectAll()
    .where("product_id", "in", productIds)
    .orderBy("sort_order asc")
    .execute()
  const map = new Map<string, Selectable<ProductImagesTable>[]>()
  for (const img of images) {
    const list = map.get(img.product_id) ?? []
    list.push(img)
    map.set(img.product_id, list)
  }
  return map
}

export const listProducts = async (filters?: { featured?: boolean; categoryId?: string }) => {
  let q = db.selectFrom("products").selectAll().where("is_active", "=", true)
  if (filters?.featured === true) q = q.where("featured", "=", true)
  if (filters?.categoryId) q = q.where("category_id", "=", filters.categoryId)
  const rows = await q.orderBy("name asc").execute()
  const imgMap = await loadImagesForProducts(rows.map((r) => r.id))
  return rows.map((row) => toProduct(row, imgMap.get(row.id) ?? []))
}

export const listProductsAdmin = async (filters: {
  q?: string
  page?: number
  limit?: number
  categoryId?: string
  urgencyBadge?: string
  featured?: boolean
  includeInactive?: boolean
}) => {
  const page = Math.max(1, Math.floor(filters.page ?? 1))
  const limit = Math.min(100, Math.max(1, Math.floor(filters.limit ?? 20)))
  const offset = (page - 1) * limit
  const term = filters.q?.trim()
  const likePattern = term ? `%${term}%` : null

  let rowsQuery = db.selectFrom("products").selectAll()
  if (filters.includeInactive === false) rowsQuery = rowsQuery.where("is_active", "=", true)
  if (filters.categoryId) rowsQuery = rowsQuery.where("category_id", "=", filters.categoryId)
  if (filters.urgencyBadge) rowsQuery = rowsQuery.where("urgency_badge", "=", filters.urgencyBadge)
  if (filters.featured !== undefined) rowsQuery = rowsQuery.where("featured", "=", filters.featured)
  if (likePattern) {
    rowsQuery = rowsQuery.where((eb) =>
      eb.or([eb("name", "ilike", likePattern), eb("description", "ilike", likePattern)]),
    )
  }

  const rows = await rowsQuery
    .orderBy("created_at desc")
    .limit(limit)
    .offset(offset)
    .execute()

  let countQuery = db.selectFrom("products").select(({ fn }) => fn.countAll<string>().as("count"))
  if (filters.includeInactive === false) countQuery = countQuery.where("is_active", "=", true)
  if (filters.categoryId) countQuery = countQuery.where("category_id", "=", filters.categoryId)
  if (filters.urgencyBadge) countQuery = countQuery.where("urgency_badge", "=", filters.urgencyBadge)
  if (filters.featured !== undefined) countQuery = countQuery.where("featured", "=", filters.featured)
  if (likePattern) {
    countQuery = countQuery.where((eb) =>
      eb.or([eb("name", "ilike", likePattern), eb("description", "ilike", likePattern)]),
    )
  }

  const countRow = await countQuery.executeTakeFirst()
  const total = Number(countRow?.count ?? 0)

  const imgMap = await loadImagesForProducts(rows.map((r) => r.id))
  const items = rows.map((row) => toProduct(row, imgMap.get(row.id) ?? []))
  return { items, total, page, limit }
}

export const getProduct = async (id: string) => {
  const row = await db.selectFrom("products").selectAll().where("id", "=", id).executeTakeFirst()
  if (!row) return undefined
  const imgs = await db.selectFrom("product_images").selectAll().where("product_id", "=", id).orderBy("sort_order asc").execute()
  return toProduct(row, imgs)
}

export const listProductsByCategory = async (categoryId: string) => listProducts({ categoryId })

export const listRecommendations = async (productId: string, limit = 8) => {
  const source = await db
    .selectFrom("products")
    .select(["id", "category_id"])
    .where("id", "=", productId)
    .executeTakeFirst()
  if (!source) return []

  const sameCategory = await db
    .selectFrom("products")
    .selectAll()
    .where("is_active", "=", true)
    .where("id", "!=", productId)
    .where("category_id", "=", source.category_id)
    .orderBy("featured", "desc")
    .orderBy("name", "asc")
    .limit(limit)
    .execute()

  let rows = sameCategory
  if (rows.length < limit) {
    const excludeIds = [productId, ...rows.map((r) => r.id)]
    const fillers = await db
      .selectFrom("products")
      .selectAll()
      .where("is_active", "=", true)
      .where("id", "not in", excludeIds)
      .orderBy("featured", "desc")
      .orderBy("name", "asc")
      .limit(limit - rows.length)
      .execute()
    rows = [...rows, ...fillers]
  }

  const imgMap = await loadImagesForProducts(rows.map((r) => r.id))
  return rows.map((row) => toProduct(row, imgMap.get(row.id) ?? []))
}

export const createProduct = async (input: {
  categoryId: string
  name: string
  description?: string
  price: string
  stockQuantity?: number
  lowStockThreshold?: number
  urgencyBadge?: string
  featured?: boolean
  imageUrls?: string[]
  videoUrl?: string | null
}) => {
  const row = await db
    .insertInto("products")
    .values({
      category_id: input.categoryId,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      is_active: true,
      stock_quantity: input.stockQuantity ?? 0,
      low_stock_threshold: input.lowStockThreshold ?? 5,
      urgency_badge: input.urgencyBadge ?? "none",
      featured: input.featured ?? false,
      published_at: new Date(),
      video_url: input.videoUrl ?? null,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const urls = input.imageUrls?.filter(Boolean) ?? []
  if (urls.length > 0) {
    await db
      .insertInto("product_images")
      .values(
        urls.map((url, i) => ({
          product_id: row.id,
          url,
          sort_order: i,
        })),
      )
      .execute()
  }

  return getProduct(row.id) as Promise<ReturnType<typeof toProduct>>
}

export const updateProduct = async (
  id: string,
  input: {
    categoryId?: string
    name?: string
    description?: string
    price?: string
    isActive?: boolean
    stockQuantity?: number
    lowStockThreshold?: number
    urgencyBadge?: string
    featured?: boolean
    imageUrls?: string[]
    videoUrl?: string | null
  },
) => {
  const patch: Record<string, unknown> = { updated_at: new Date() }
  if (input.categoryId !== undefined) patch.category_id = input.categoryId
  if (input.name !== undefined) patch.name = input.name
  if (input.description !== undefined) patch.description = input.description
  if (input.price !== undefined) patch.price = input.price
  if (input.isActive !== undefined) patch.is_active = input.isActive
  if (input.stockQuantity !== undefined) patch.stock_quantity = input.stockQuantity
  if (input.lowStockThreshold !== undefined) patch.low_stock_threshold = input.lowStockThreshold
  if (input.urgencyBadge !== undefined) patch.urgency_badge = input.urgencyBadge
  if (input.featured !== undefined) patch.featured = input.featured
  if (input.videoUrl !== undefined) patch.video_url = input.videoUrl

  const row = await db.updateTable("products").set(patch as never).where("id", "=", id).returningAll().executeTakeFirst()
  if (!row) return undefined

  if (input.imageUrls !== undefined) {
    await db.deleteFrom("product_images").where("product_id", "=", id).execute()
    const urls = input.imageUrls.filter(Boolean)
    if (urls.length > 0) {
      await db
        .insertInto("product_images")
        .values(
          urls.map((url, i) => ({
            product_id: id,
            url,
            sort_order: i,
          })),
        )
        .execute()
    }
  }

  return getProduct(id) as Promise<ReturnType<typeof toProduct>>
}

export const removeProduct = async (id: string) => {
  return db.deleteFrom("products").where("id", "=", id).executeTakeFirst()
}
