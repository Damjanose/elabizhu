import type { OrderSummary } from "@jewellery/types"
import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  getDailyOrderSeries,
  getOrderStatusDistribution,
  getTrailingPeriodStats,
} from "../../lib/admin-dashboard-metrics"
import { formatDisplayMoney } from "../../lib/display-currency"
import { useAdminDisplayCurrency } from "../../stores/adminDisplayCurrencyStore"
import { useI18n } from "../../i18n"

type Props = {
  orders: OrderSummary[]
}

const ChartTooltip = ({
  active,
  payload,
  label,
  formatRevenue,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[]
  label?: string
  formatRevenue: (value: number) => string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="aurelia-admin-chart-tooltip">
      <p className="aurelia-admin-chart-tooltip-label">{label}</p>
      <ul className="aurelia-admin-chart-tooltip-list">
        {payload.map((item) => (
          <li key={String(item.dataKey)}>
            <span className="aurelia-admin-chart-tooltip-swatch" style={{ background: item.color }} />
            <span>{item.name}</span>
            <strong>
              {item.dataKey === "revenue" && item.value != null ? formatRevenue(item.value) : item.value}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const AdminDashboardCharts = ({ orders }: Props) => {
  const { t } = useI18n()
  const displayCurrency = useAdminDisplayCurrency()
  const dayCount = 14
  const daily = getDailyOrderSeries(orders, dayCount)
  const statusRows = getOrderStatusDistribution(orders)
  const trailing = getTrailingPeriodStats(orders, dayCount)

  const formatRevenueCompact = useMemo(
    () => (n: number) => formatDisplayMoney(n, displayCurrency, { maximumFractionDigits: 0 }),
    [displayCurrency],
  )

  const formatRevenueAxis = useMemo(
    () => (v: number) => formatDisplayMoney(v, displayCurrency, { maximumFractionDigits: 0 }),
    [displayCurrency],
  )

  const hasAnyOrders = orders.length > 0

  return (
    <section className="aurelia-admin-charts-section" aria-label={t("admin.charts.sectionAria")}>
      <div className="aurelia-admin-dashboard-table-header">
        <div>
          <h2 className="aurelia-admin-card-title mb-2">{t("admin.charts.title")}</h2>
          <p className="aurelia-muted mb-0">
            {t("admin.charts.summary", {
              days: trailing.dayCount,
              orders: trailing.totalOrders,
              revenue: formatRevenueCompact(trailing.totalRevenue),
              average: formatRevenueCompact(trailing.avgOrderValue),
            })}
          </p>
        </div>
      </div>

      <div className="aurelia-admin-charts-grid">
        <article className="aurelia-admin-chart-card">
          <p className="aurelia-admin-chart-kicker">{t("admin.charts.ordersByDay")}</p>
          {hasAnyOrders ? (
            <div className="aurelia-admin-chart-frame" role="img" aria-label={t("admin.charts.barLineAria")}>
              <ResponsiveContainer width="100%" height="100%" minHeight={260}>
                <ComposedChart data={daily} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(209, 197, 180, 0.45)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#7f7667" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 10, fill: "#7f7667" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={32}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: "#7f7667" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatRevenueAxis}
                    width={displayCurrency === "ALL" ? 48 : 40}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => (
                      <ChartTooltip
                        active={active}
                        payload={
                          payload as unknown as
                            | { name?: string; value?: number; color?: string; dataKey?: string }[]
                            | undefined
                        }
                        label={typeof label === "string" ? label : undefined}
                        formatRevenue={formatRevenueCompact}
                      />
                    )}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: 8 }}
                    formatter={(value) => <span className="aurelia-admin-chart-legend-text">{value}</span>}
                  />
                  <Bar yAxisId="left" dataKey="orders" name={t("admin.charts.seriesOrders")} fill="#c5a059" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    name={t("admin.charts.seriesRevenue")}
                    stroke="#4e4639"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#4e4639" }}
                    activeDot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="aurelia-admin-chart-empty aurelia-muted mb-0">{t("admin.charts.noHistory")}</p>
          )}
        </article>

        <article className="aurelia-admin-chart-card">
          <p className="aurelia-admin-chart-kicker">{t("admin.charts.ordersByStatus")}</p>
          {statusRows.length > 0 ? (
            <div className="aurelia-admin-chart-frame" role="img" aria-label={t("admin.charts.statusBarAria")}>
              <ResponsiveContainer width="100%" height="100%" minHeight={260}>
                <BarChart data={statusRows} layout="vertical" margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                  <CartesianGrid stroke="rgba(209, 197, 180, 0.45)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#7f7667" }} allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={88}
                    tick={{ fontSize: 10, fill: "#4e4639" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(197, 160, 89, 0.08)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null
                      const row = payload[0].payload as { label: string; count: number }
                      return (
                        <div className="aurelia-admin-chart-tooltip">
                          <p className="aurelia-admin-chart-tooltip-label">{row.label}</p>
                          <p className="mb-0">
                            <strong>{row.count}</strong> {t(row.count === 1 ? "admin.charts.orderSingular" : "admin.charts.orderPlural")}
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="count" name={t("admin.charts.seriesOrders")} radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {statusRows.map((row) => (
                      <Cell key={row.status} fill={row.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="aurelia-admin-chart-empty aurelia-muted mb-0">{t("admin.charts.noStatus")}</p>
          )}
        </article>
      </div>
    </section>
  )
}
