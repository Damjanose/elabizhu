import { useMemo } from "react"
import { AureliaCustomSelect } from "../forms/AureliaCustomSelect"
import { DISPLAY_CURRENCIES, DISPLAY_CURRENCY_LABEL, isDisplayCurrencyCode } from "../../lib/display-currency"
import { useAdminDisplayCurrency, useAdminDisplayCurrencyStore } from "../../stores/adminDisplayCurrencyStore"

export const AdminCurrencySelect = () => {
  const currency = useAdminDisplayCurrency()
  const setCurrency = useAdminDisplayCurrencyStore((s) => s.setCurrency)

  const options = useMemo(
    () =>
      DISPLAY_CURRENCIES.map((code) => ({
        value: code,
        label: `${code} — ${DISPLAY_CURRENCY_LABEL[code]}`,
      })),
    [],
  )

  return (
    <label className="aurelia-select-wrap aurelia-select-wrap--topbar" htmlFor="admin-display-currency">
      <span className="visually-hidden">Display amounts in</span>
      <AureliaCustomSelect
        id="admin-display-currency"
        value={currency}
        onChange={(v) => {
          if (isDisplayCurrencyCode(v)) setCurrency(v)
        }}
        options={options}
        variant="compact"
      />
    </label>
  )
}
