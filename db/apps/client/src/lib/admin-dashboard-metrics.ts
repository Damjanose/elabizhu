import type { OrderSummary, Product } from "@jewellery/types"

const isSameWeek = (iso: string) => {
  const date = new Date(iso)
  const now = new Date()
  const day = (now.getDay() + 6) % 7
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - day)
  startOfWeek.setHours(0, 0, 0, 0)
  return date >= startOfWeek
}

export const getDashboardMetrics = (orders: OrderSummary[], products: Product[]) => {
  const activeOrders = orders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length
  const pendingShipments = orders.filter((order) => ["confirmed", "shipped"].includes(order.status)).length
  const inventoryAlert = products.filter((product) => product.stockQuantity <= product.lowStockThreshold || product.urgencyBadge === "low_stock").length
  const weeklyRevenue = orders
    .filter((order) => isSameWeek(order.createdAt) && order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total), 0)

  return {
    activeOrders,
    pendingShipments,
    inventoryAlert,
    weeklyRevenue,
  }
}
