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

export const AdminOrdersPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ["orders"], queryFn: fetchOrders })

  const patch = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => updateOrderStatus(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["orders"] }),
  })

  if (isLoading) return <div className="alert alert-info">Loading…</div>

  return (
    <div className="aurelia-admin-page">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <p className="aurelia-admin-kicker mb-2">Operations</p>
          <h1 className="aurelia-admin-title mb-0">Order flow</h1>
        </div>
      </div>
      <div className="table-responsive aurelia-admin-table-wrap">
        <table className="table align-middle mb-0 aurelia-admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Status</th>
              <th>Total</th>
              <th>Next step</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data?.map((o) => (
              <tr key={o.id}>
                <td>{new Date(o.createdAt).toLocaleString()}</td>
                <td className="text-capitalize">{o.status}</td>
                <td>${Number(o.total).toFixed(2)}</td>
                <td>
                  <div className="d-flex flex-wrap gap-1">
                    {nextOptions(o.status).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="aurelia-btn aurelia-btn-outline"
                        disabled={patch.isPending}
                        onClick={() => void patch.mutateAsync({ id: o.id, status: s })}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </td>
                <td>
                  <Link to={`/orders/${o.id}`} className="aurelia-btn aurelia-btn-ghost text-decoration-none">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
