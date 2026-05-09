import type { OrderStatus, OrderSummary, Product } from "@jewellery/types"

const toLocalDateKey = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

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

export type DailyOrderPoint = {
  key: string
  label: string
  orders: number
  revenue: number
}

/** Last `dayCount` calendar days (including today), local time. */
export const getDailyOrderSeries = (orders: OrderSummary[], dayCount = 14): DailyOrderPoint[] => {
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  const start = new Date(end)
  start.setDate(start.getDate() - (dayCount - 1))

  const series: DailyOrderPoint[] = []
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    series.push({
      key: toLocalDateKey(d),
      label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      orders: 0,
      revenue: 0,
    })
  }

  const byKey = new Map(series.map((s) => [s.key, s]))
  for (const order of orders) {
    const od = new Date(order.createdAt)
    od.setHours(0, 0, 0, 0)
    const bucket = byKey.get(toLocalDateKey(od))
    if (!bucket) continue
    bucket.orders += 1
    if (order.status !== "cancelled") {
      bucket.revenue += Number(order.total)
    }
  }
  return series
}

const STATUS_ORDER: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"]

const STATUS_DISPLAY: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

const STATUS_CHART_COLOR: Record<OrderStatus, string> = {
  pending: "#8a7f70",
  confirmed: "#c5a059",
  shipped: "#4a6fa5",
  delivered: "#556156",
  cancelled: "#a85c5c",
}

export type StatusCountPoint = {
  status: OrderStatus
  label: string
  count: number
  fill: string
}

export const getOrderStatusDistribution = (orders: OrderSummary[]): StatusCountPoint[] => {
  const counts = new Map<OrderStatus, number>()
  for (const s of STATUS_ORDER) counts.set(s, 0)
  for (const order of orders) {
    counts.set(order.status, (counts.get(order.status) ?? 0) + 1)
  }
  return STATUS_ORDER.filter((s) => (counts.get(s) ?? 0) > 0).map((status) => ({
    status,
    label: STATUS_DISPLAY[status],
    count: counts.get(status) ?? 0,
    fill: STATUS_CHART_COLOR[status],
  }))
}

export type TrailingPeriodStats = {
  dayCount: number
  totalOrders: number
  totalRevenue: number
  avgOrderValue: number
}

export const getTrailingPeriodStats = (orders: OrderSummary[], dayCount = 14): TrailingPeriodStats => {
  const series = getDailyOrderSeries(orders, dayCount)
  const totalOrders = series.reduce((sum, d) => sum + d.orders, 0)
  const totalRevenue = series.reduce((sum, d) => sum + d.revenue, 0)

  const end = new Date()
  end.setHours(0, 0, 0, 0)
  const rangeStart = new Date(end)
  rangeStart.setDate(rangeStart.getDate() - (dayCount - 1))

  let nonCancelledInRange = 0
  for (const order of orders) {
    const od = new Date(order.createdAt)
    od.setHours(0, 0, 0, 0)
    if (od < rangeStart || od > end) continue
    if (order.status !== "cancelled") nonCancelledInRange += 1
  }

  return {
    dayCount,
    totalOrders,
    totalRevenue,
    avgOrderValue: nonCancelledInRange ? totalRevenue / nonCancelledInRange : 0,
  }
}
