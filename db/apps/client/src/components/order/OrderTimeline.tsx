import type { OrderStatus, OrderStatusEventDto } from "@jewellery/types"
import { useI18n, type Lang } from "../../i18n"

const STATUS_KEYS: Record<OrderStatus, string> = {
  pending: "account.status.pending",
  confirmed: "account.status.confirmed",
  shipped: "account.status.shipped",
  delivered: "account.status.delivered",
  cancelled: "account.status.cancelled",
}

const localeFor = (lang: Lang) => (lang === "sq" ? "sq-AL" : "en-GB")

const formatDateTime = (iso: string, lang: Lang) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat(localeFor(lang), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export const OrderTimeline = ({ events }: { events: OrderStatusEventDto[] }) => {
  const { t, lang } = useI18n()
  if (!events.length) return null

  // Sort newest first so the most recent state sits at the top of the rail.
  const sorted = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <ol className="aurelia-timeline-list" aria-label={t("account.timeline.aria")}>
      {sorted.map((event, index) => (
        <li
          key={event.id}
          className={`aurelia-timeline-step ${index === 0 ? "is-active" : ""}`}
        >
          <span className="aurelia-timeline-dot" aria-hidden />
          <div className="aurelia-timeline-step-body">
            <span className="aurelia-timeline-label">
              {STATUS_KEYS[event.status] ? t(STATUS_KEYS[event.status]) : event.status}
            </span>
            {event.note && <p className="aurelia-timeline-text">{event.note}</p>}
            <time className="aurelia-timeline-meta" dateTime={event.createdAt}>
              {formatDateTime(event.createdAt, lang)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  )
}
