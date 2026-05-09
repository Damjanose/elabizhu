export type PermissionName =
  | "admin"
  | "administrator"
  | "product.read"
  | "product.write"
  | "category.read"
  | "category.write"
  | "order.read"
  | "order.write"

export type User = {
  id: string
  email: string
  isActive: boolean
  fullName: string
  phone: string | null
  permissions: PermissionName[]
}

export type Address = {
  id: string
  label: string
  recipientName: string
  line1: string
  line2: string | null
  city: string
  postalCode: string
  country: string
  phone: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type UpdateProfileInput = {
  fullName: string
  phone?: string | null
}

export type AddressInput = {
  label: string
  recipientName: string
  line1: string
  line2?: string | null
  city: string
  postalCode: string
  country: string
  phone?: string | null
  isDefault?: boolean
}

export type Category = {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export type UrgencyBadge = "new" | "low_stock" | "sold_out" | "none"

export type ProductImage = {
  id: string
  url: string
  sortOrder: number
}

export type Product = {
  id: string
  categoryId: string
  name: string
  description: string | null
  price: string
  isActive: boolean
  stockQuantity: number
  lowStockThreshold: number
  urgencyBadge: UrgencyBadge
  featured: boolean
  publishedAt: string | null
  images: ProductImage[]
  videoUrl: string | null
  createdAt: string
  updatedAt: string
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

export type AuthResponse = {
  user: User
  tokens: AuthTokens
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  email: string
  password: string
  fullName: string
}

export type CreateCategoryInput = {
  name: string
  description?: string
}

export type UpdateCategoryInput = {
  name?: string
  description?: string
}

export type CreateProductInput = {
  categoryId: string
  name: string
  description?: string
  price: string
  stockQuantity?: number
  lowStockThreshold?: number
  urgencyBadge?: UrgencyBadge
  featured?: boolean
  imageUrls?: string[]
  videoUrl?: string | null
}

export type UpdateProductInput = {
  categoryId?: string
  name?: string
  description?: string
  price?: string
  isActive?: boolean
  stockQuantity?: number
  lowStockThreshold?: number
  urgencyBadge?: UrgencyBadge
  featured?: boolean
  imageUrls?: string[]
  videoUrl?: string | null
}

export type AdminProductListResponse = {
  items: Product[]
  total: number
  page: number
  limit: number
}

export type UploadKind = "image" | "video"

export type UploadResponse = {
  url: string
  kind: UploadKind
}

export type CartLine = {
  productId: string
  name: string
  price: string
  quantity: number
  imageUrl: string | null
}

export type CartResponse = {
  items: CartLine[]
  subtotal: string
}

export type CheckoutInput = {
  shippingAddress: string
  paymentMethod: string
}

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"

export type OrderItemDto = {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: string
  /** First product image by sort order, when present */
  imageUrl: string | null
}

export type OrderStatusEventDto = {
  id: string
  status: OrderStatus
  note: string | null
  createdAt: string
}

export type OrderSummary = {
  id: string
  userId: string
  status: OrderStatus
  total: string
  createdAt: string
  updatedAt: string
}

export type OrderDetail = OrderSummary & {
  items: OrderItemDto[]
  timeline: OrderStatusEventDto[]
  shippingAddress: string | null
  paymentMethod: string | null
}

export type NotificationDto = {
  id: string
  type: string
  title: string
  body: string | null
  readAt: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export type UpdateOrderStatusInput = {
  status: OrderStatus
  note?: string
}

export type AdminUserRow = {
  id: string
  email: string
  fullName: string
  phone: string | null
  isActive: boolean
  hasActiveSession: boolean
  permissions: PermissionName[]
  createdAt: string
  updatedAt: string
}

export type AdminUsersListResponse = {
  users: AdminUserRow[]
  availablePermissions: PermissionName[]
}

export type UpdateUserActiveInput = {
  isActive: boolean
}

export type UpdateUserPermissionsInput = {
  permissions: PermissionName[]
}
