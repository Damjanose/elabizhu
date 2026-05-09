import type {
  AdminProductListResponse,
  CreateProductInput,
  Product,
  UpdateProductInput,
  UploadResponse,
  UrgencyBadge,
} from "@jewellery/types"
import { apiClient } from "../api/client"
import { getEnv } from "../config/env"

export const createProduct = async (input: CreateProductInput) => {
  const { data } = await apiClient.post<Product>("/products", input)
  return data
}

export const updateProduct = async (id: string, input: UpdateProductInput) => {
  const { data } = await apiClient.patch<Product>(`/products/${id}`, input)
  return data
}

export const deleteProduct = async (id: string) => {
  await apiClient.delete(`/products/${id}`)
}

export type AdminProductsQuery = {
  q?: string
  page?: number
  limit?: number
  categoryId?: string
  urgencyBadge?: UrgencyBadge
  featured?: boolean
  includeInactive?: boolean
}

export const fetchAdminProducts = async (params: AdminProductsQuery = {}) => {
  const search: Record<string, string | number> = {}
  if (params.q && params.q.length > 0) search.q = params.q
  if (params.page) search.page = params.page
  if (params.limit) search.limit = params.limit
  if (params.categoryId) search.categoryId = params.categoryId
  if (params.urgencyBadge) search.urgencyBadge = params.urgencyBadge
  if (params.featured !== undefined) search.featured = String(params.featured)
  if (params.includeInactive !== undefined) search.includeInactive = String(params.includeInactive)
  const { data } = await apiClient.get<AdminProductListResponse>("/admin/products", { params: search })
  return data
}

export const uploadMedia = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append("file", file)
  const { data } = await apiClient.post<UploadResponse>("/admin/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export const resolveMediaUrl = (url: string | null | undefined) => {
  if (!url) return ""
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) return url
  if (url.startsWith("/")) return `${getEnv().apiUrl}${url}`
  return url
}
