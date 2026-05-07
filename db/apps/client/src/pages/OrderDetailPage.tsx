import { useQuery } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Link, useParams } from "react-router-dom"
import { OrderTimeline } from "../components/order/OrderTimeline"
import { EmptyState } from "../components/feedback/EmptyState"
import { fetchOrder } from "../services/orders"

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))

export const OrderDetailPage = () => {
  const { orderId = "" } = useParams<{ orderId: string }>()
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: !!orderId,
    retry: false,
  })

  if (isLoading) {
    return (
      <section className="aurelia-detail-shell">
        <EmptyState
          variant="page"
          icon="hourglass_empty"
          kicker="Loading"
          title="Retrieving your order…"
          copy="One moment while we pull the latest details from the atelier."
        />
      </section>
    )
  }

  if (isError || !data) {
    const status = isAxiosError(error) ? error.response?.status : undefined
    if (status === 404) {
      return (
        <section className="aurelia-detail-shell">
          <EmptyState
            variant="page"
            icon="search_off"
            kicker="Order Not Found"
            title="We couldn’t locate this order"
            copy="The reference you used may be incorrect, or the order belongs to a different account."
            cta={{ to: "/orders", label: "Back to Orders" }}
            secondaryCta={{ to: "/products", label: "Browse Collections" }}
          />
        </section>
      )
    }
    return (
      <section className="aurelia-detail-shell">
        <EmptyState
          variant="page"
          icon="error"
          tone="danger"
          kicker="Something Went Wrong"
          title="Could not load this order"
          copy="An unexpected error interrupted our request. Please try again."
          cta={{ label: isFetching ? "Retrying…" : "Try Again", onClick: () => void refetch() }}
          secondaryCta={{ to: "/orders", label: "Back to Orders" }}
        />
      </section>
    )
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <Link to="/orders" className="small text-decoration-none mb-2 d-inline-block">
          ← Back to orders
        </Link>
        <h1 className="h3 fw-bold mb-1">Order {data.id.slice(0, 8)}…</h1>
        <p className="text-secondary text-capitalize mb-4">Status: {data.status}</p>

        <div className="row g-4">
          <div className="col-lg-6">
            <h2 className="h6 text-uppercase text-secondary">Items</h2>
            {data.items.length === 0 ? (
              <EmptyState
                variant="inline"
                icon="inventory_2"
                title="No items recorded"
                copy="This order has no items associated with it."
              />
            ) : (
              <ul className="list-group">
                {data.items.map((i) => (
                  <li key={i.id} className="list-group-item d-flex justify-content-between">
                    <span>
                      {i.productName} × {i.quantity}
                    </span>
                    <span>{formatCurrency(i.unitPrice)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="fw-bold mt-3 mb-0">Total {formatCurrency(data.total)}</p>
            {data.shippingAddress && (
              <p className="small text-secondary mt-3 mb-0">
                <strong>Ship to:</strong> {data.shippingAddress}
              </p>
            )}
          </div>
          <div className="col-lg-6">
            <h2 className="h6 text-uppercase text-secondary">Timeline</h2>
            {data.timeline.length === 0 ? (
              <EmptyState
                variant="inline"
                icon="timeline"
                title="No tracking events yet"
                copy="We’ll record updates here as your order progresses."
              />
            ) : (
              <OrderTimeline events={data.timeline} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
