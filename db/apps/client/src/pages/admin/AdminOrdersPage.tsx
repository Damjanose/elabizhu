import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { OrderStatus } from "@jewellery/types"
import { Link } from "react-router-dom"
import { fetchOrders, updateOrderStatus } from "../../services/orders"

const nextOptions = (current: OrderStatus): OrderStatus[] => {
  switch (current) {
    case "pending":
      return ["confirmed", "cancelled"]
    case "confirmed":
      return ["shipped", "cancelled"]
    case "shipped":
      return ["delivered"]
    default:
      return []
  }
}

const nextStepTone = (status: OrderStatus) => {
  if (status === "delivered") return "is-success"
  if (status === "shipped") return "is-info"
  if (status === "confirmed") return "is-warning"
  if (status === "cancelled") return "is-danger"
  return "is-muted"
}

const statusLabel = (status: OrderStatus) => status.charAt(0).toUpperCase() + status.slice(1)
const clientLabel = (userId: string) => `Client ${userId.slice(0, 6).toUpperCase()}`
const tierLabel = (id: string) => `Tier ${id.slice(0, 4).toUpperCase()}`
const pieceLabel = (id: string) => `Signature Piece ${id.slice(0, 4).toUpperCase()}`
const orderLabel = (id: string) => `#AUR-${id.slice(0, 4).toUpperCase()}`

export const AdminOrdersPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ["orders"], queryFn: fetchOrders })
  const [confirmIntent, setConfirmIntent] = useState<{
    id: string
    from: OrderStatus
    to: OrderStatus
  } | null>(null)
  const [undoIntent, setUndoIntent] = useState<{
    id: string
    from: OrderStatus
    to: OrderStatus
  } | null>(null)
  const [menuOrderId, setMenuOrderId] = useState<string | null>(null)

  const patch = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => updateOrderStatus(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["orders"] }),
  })

  const runConfirmedAction = () => {
    if (!confirmIntent) return
    const currentIntent = confirmIntent
    void patch.mutateAsync({ id: currentIntent.id, status: currentIntent.to }).then(() => {
      setUndoIntent(currentIntent)
    })
    setConfirmIntent(null)
  }

  const runUndoAction = () => {
    if (!undoIntent) return
    const currentUndoIntent = undoIntent
    void patch.mutateAsync({ id: currentUndoIntent.id, status: currentUndoIntent.from }).then(() => {
      setUndoIntent(null)
    })
  }

  const orders = data ?? []
  const activeOrdersCount = orders.filter((order) => nextOptions(order.status).length > 0).length

  if (isLoading) return <div className="aurelia-admin-panel p-4">Loading orders…</div>

  return (
    <div className="aurelia-admin-page">
      <div className="aurelia-admin-page-header">
        <div>
          <p className="aurelia-admin-kicker mb-2">Operations</p>
          <h1 className="aurelia-admin-title mb-0">Order flow</h1>
        </div>
      </div>
      {undoIntent && (
        <div className="aurelia-admin-panel p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <p className="mb-0">
            Status updated to <strong>{statusLabel(undoIntent.to)}</strong>. Wrong click?
          </p>
          <button
            type="button"
            className="aurelia-btn aurelia-btn-outline"
            onClick={runUndoAction}
            disabled={patch.isPending}
          >
            {patch.isPending ? "Reverting..." : "Undo / Back"}
          </button>
        </div>
      )}
      <section className="aurelia-admin-orders-section">
        <div className="table-responsive aurelia-admin-table-wrap aurelia-admin-orders-table-wrap">
          <table className="table align-middle mb-0 aurelia-admin-table aurelia-admin-orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Piece</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="aurelia-admin-orders-row">
                <td className="aurelia-admin-orders-id">
                  <strong>{orderLabel(o.id)}</strong>
                  <span>{new Date(o.createdAt).toLocaleDateString("en-GB")}</span>
                </td>
                <td className="aurelia-admin-orders-customer">
                  <strong>{clientLabel(o.userId)}</strong>
                  <span>{tierLabel(o.id)}</span>
                </td>
                <td className="aurelia-admin-orders-piece">
                  <strong>{pieceLabel(o.id)}</strong>
                  <span>{`Total ${Number(o.total).toFixed(2)} GBP`}</span>
                </td>
                <td>
                  <span className={`aurelia-admin-status-chip ${o.status === "delivered" ? "is-success" : o.status === "shipped" ? "is-info" : o.status === "confirmed" ? "is-warning" : o.status === "cancelled" ? "is-danger" : "is-muted"}`}>
                    {o.status}
                  </span>
                </td>
                <td className="text-end">
                  <div className="aurelia-admin-orders-actions">
                    <button
                      type="button"
                      className="aurelia-admin-icon-link aurelia-admin-orders-open"
                      aria-label={`Actions for order ${orderLabel(o.id)}`}
                      onClick={() => setMenuOrderId((current) => (current === o.id ? null : o.id))}
                    >
                      <span className="material-symbols-outlined" aria-hidden>more_horiz</span>
                    </button>
                    {menuOrderId === o.id && (
                      <div className="aurelia-admin-orders-action-menu" role="menu" aria-label={`Order actions for ${orderLabel(o.id)}`}>
                        {nextOptions(o.status).map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`aurelia-btn aurelia-admin-next-step-btn ${nextStepTone(s)}`}
                            disabled={patch.isPending}
                            onClick={() => {
                              setConfirmIntent({ id: o.id, from: o.status, to: s })
                              setMenuOrderId(null)
                            }}
                          >
                            {s}
                          </button>
                        ))}
                        <Link
                          to={`/orders/${o.id}`}
                          className="aurelia-btn aurelia-btn-ghost text-decoration-none"
                          onClick={() => setMenuOrderId(null)}
                        >
                          Open
                        </Link>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
          <div className="aurelia-admin-table-foot aurelia-admin-orders-foot">
            <span>Showing {orders.length} of {activeOrdersCount} active orders</span>
            <div className="aurelia-admin-orders-pager" aria-hidden>
              <button type="button" className="aurelia-admin-orders-pager-btn" tabIndex={-1}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button type="button" className="aurelia-admin-orders-pager-btn" tabIndex={-1}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </section>
      {confirmIntent && (
        <div className="aurelia-admin-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-order-confirm-title">
          <div className="aurelia-admin-confirm-modal">
            <p className="aurelia-admin-kicker mb-2">Confirm status change</p>
            <h3 id="admin-order-confirm-title" className="aurelia-admin-card-title mb-2">
              Move to {statusLabel(confirmIntent.to)}?
            </h3>
            <p className="aurelia-muted mb-3">
              This order will move from {statusLabel(confirmIntent.from)} to {statusLabel(confirmIntent.to)}.
              If this was a wrong click, use Back.
            </p>
            <div className="aurelia-admin-confirm-actions">
              <button type="button" className="aurelia-btn aurelia-btn-outline" onClick={() => setConfirmIntent(null)}>
                Back
              </button>
              <button
                type="button"
                className={`aurelia-btn aurelia-admin-next-step-btn ${nextStepTone(confirmIntent.to)}`}
                onClick={runConfirmedAction}
                disabled={patch.isPending}
              >
                {patch.isPending ? "Updating..." : `Confirm ${statusLabel(confirmIntent.to)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
