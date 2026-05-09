import { DISPLAY_CURRENCIES, DISPLAY_CURRENCY_LABEL, isDisplayCurrencyCode } from "../../lib/display-currency"
import { useAdminDisplayCurrency, useAdminDisplayCurrencyStore } from "../../stores/adminDisplayCurrencyStore"

export const AdminCurrencySelect = () => {
  const currency = useAdminDisplayCurrency()
  const setCurrency = useAdminDisplayCurrencyStore((s) => s.setCurrency)

  return (
    <label className="aurelia-admin-currency-select-wrap">
      <span className="visually-hidden">Display amounts in</span>
      <select
        className="aurelia-admin-currency-select"
        value={currency}
        onChange={(e) => {
          const v = e.target.value
          if (isDisplayCurrencyCode(v)) setCurrency(v)
        }}
        aria-label="Display currency for admin amounts"
      >
        {DISPLAY_CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code} — {DISPLAY_CURRENCY_LABEL[code]}
          </option>
        ))}
      </select>
    </label>
  )
}
