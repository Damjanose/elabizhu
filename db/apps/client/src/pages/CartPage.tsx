import { Link } from "react-router-dom"
import { useCart } from "../hooks/useCart"
import { EmptyState } from "../components/feedback/EmptyState"

export const CartPage = () => {
  const { data, isLoading, isError, setQty, removeLine, isUpdating, refetch, isFetching } = useCart()

  if (isLoading) {
    return (
      <EmptyState
        variant="card"
        icon="hourglass_empty"
        kicker="Loading"
        title="Retrieving your selection…"
        copy="One moment while we gather what you’ve set aside."
      />
    )
  }

  if (isError) {
    return (
      <EmptyState
        variant="card"
        tone="danger"
        icon="error"
        kicker="Connection Issue"
        title="We couldn’t load your cart"
        copy="An unexpected error interrupted our request. Please try again."
        cta={{ label: isFetching ? "Retrying…" : "Try Again", onClick: () => void refetch() }}
        secondaryCta={{ to: "/products", label: "Browse Collections" }}
      />
    )
  }

  const items = data?.items ?? []

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <h1 className="h3 fw-bold mb-3">Cart</h1>
        {items.length === 0 ? (
          <EmptyState
            variant="inline"
            icon="shopping_bag"
            kicker="Your Atelier"
            title="Your cart is empty"
            copy="When you set a piece aside, it will rest here until you’re ready to continue."
            cta={{ to: "/products", label: "Browse Collections" }}
            secondaryCta={{ to: "/categories", label: "Shop by Category" }}
          />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-end">Price</th>
                    <th className="text-center">Qty</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((line) => (
                    <tr key={line.productId}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {line.imageUrl && (
                            <img src={line.imageUrl} alt="" width={48} height={48} className="rounded object-fit-cover" />
                          )}
                          <span className="fw-medium">{line.name}</span>
                        </div>
                      </td>
                      <td className="text-end">${Number(line.price).toFixed(2)}</td>
                      <td className="text-center" style={{ maxWidth: 120 }}>
                        <input
                          type="number"
                          min={1}
                          className="form-control form-control-sm"
                          defaultValue={line.quantity}
                          disabled={isUpdating}
                          onBlur={(e) => {
                            const q = Number(e.target.value)
                            if (Number.isFinite(q)) void setQty({ productId: line.productId, quantity: q })
                          }}
                        />
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          disabled={isUpdating}
                          onClick={() => void removeLine(line.productId)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-between align-items-center mt-3">
              <strong>Subtotal: ${Number(data?.subtotal ?? 0).toFixed(2)}</strong>
              <Link className="btn btn-primary" to="/checkout">
                Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
