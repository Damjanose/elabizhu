export const queryKeys = {
  categories: () => ["categories"] as const,
  products: {
    all: () => ["products"] as const,
    featured: () => ["products", "featured"] as const,
    adminDashboard: () => ["products", "admin-dashboard"] as const,
    list: (params: { featuredOnly?: boolean }) => ["products", params] as const,
  },
  product: {
    detail: (productId: string) => ["product", productId] as const,
    recommendations: (productId: string) => ["product", productId, "recommendations"] as const,
  },
  category: {
    detail: (categoryId: string) => ["category", categoryId] as const,
    products: (categoryId: string) => ["categoryProducts", categoryId] as const,
  },
  cart: () => ["cart"] as const,
  orders: () => ["orders"] as const,
  order: (orderId: string) => ["order", orderId] as const,
  notifications: (liveEpoch = 0) => ["notifications", liveEpoch] as const,
  me: {
    addresses: () => ["me", "addresses"] as const,
  },
  account: {
    orders: () => ["account", "orders"] as const,
    notifications: () => ["account", "notifications"] as const,
    order: (orderId: string) => ["account", "order", orderId] as const,
    product: (productId: string) => ["account", "product", productId] as const,
  },
  admin: {
    products: (params: Record<string, unknown>) => ["admin-products", params] as const,
    users: () => ["admin-users"] as const,
  },
} as const

const PERSISTED_QUERY_ROOTS = new Set([
  "categories",
  "products",
  "product",
  "category",
  "categoryProducts",
])

export const isPersistedQueryKey = (queryKey: readonly unknown[]) => {
  const root = queryKey[0]
  if (queryKey[1] === "admin-dashboard") return false
  return typeof root === "string" && PERSISTED_QUERY_ROOTS.has(root)
}

export const PRIVATE_QUERY_ROOTS = [
  "cart",
  "orders",
  "order",
  "notifications",
  "me",
  "account",
  "admin-products",
  "admin-users",
] as const
