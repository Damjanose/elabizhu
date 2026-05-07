import type { OrderStatus, OrderStatusEventDto } from "@jewellery/types"

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export const OrderTimeline = ({ events }: { events: OrderStatusEventDto[] }) => {
  if (!events.length) return null

  // Sort newest first so the most recent state sits at the top of the rail.
  const sorted = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <ol className="aurelia-timeline-list" aria-label="Order timeline">
      {sorted.map((event, index) => (
        <li
          key={event.id}
          className={`aurelia-timeline-step ${index === 0 ? "is-active" : ""}`}
        >
          <span className="aurelia-timeline-dot" aria-hidden />
          <div className="aurelia-timeline-step-body">
            <span className="aurelia-timeline-label">
              {STATUS_LABELS[event.status] ?? event.status}
            </span>
            {event.note && <p className="aurelia-timeline-text">{event.note}</p>}
            <time className="aurelia-timeline-meta" dateTime={event.createdAt}>
              {formatDateTime(event.createdAt)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  )
}
