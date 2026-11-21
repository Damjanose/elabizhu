import { useMemo } from "react"
import { AureliaCustomSelect } from "../forms/AureliaCustomSelect"
import { DISPLAY_CURRENCIES, isDisplayCurrencyCode } from "../../lib/display-currency"
import { useAdminDisplayCurrency, useAdminDisplayCurrencyStore } from "../../stores/adminDisplayCurrencyStore"
import { useI18n } from "../../i18n"

export const AdminCurrencySelect = () => {
  const { t } = useI18n()
  const currency = useAdminDisplayCurrency()
  const setCurrency = useAdminDisplayCurrencyStore((s) => s.setCurrency)

  const options = useMemo(
    () =>
      DISPLAY_CURRENCIES.map((code) => ({
        value: code,
        label: `${code} — ${t(`admin.currency.${code}`)}`,
      })),
    [t],
  )

  return (
    <label className="aurelia-select-wrap aurelia-select-wrap--topbar" htmlFor="admin-display-currency">
      <span className="visually-hidden">{t("admin.currency.displayIn")}</span>
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
