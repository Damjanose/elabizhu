export const DISPLAY_CURRENCIES = ["GBP", "EUR", "ALL"] as const

export type DisplayCurrencyCode = (typeof DISPLAY_CURRENCIES)[number]

export const DEFAULT_DISPLAY_CURRENCY: DisplayCurrencyCode = "GBP"

const LOCALE_BY_CODE: Record<DisplayCurrencyCode, string> = {
  GBP: "en-GB",
  EUR: "de-DE",
  ALL: "sq-AL",
}

export const DISPLAY_CURRENCY_LABEL: Record<DisplayCurrencyCode, string> = {
  GBP: "Pound sterling",
  EUR: "Euro",
  ALL: "Albanian lek",
}

export function isDisplayCurrencyCode(value: unknown): value is DisplayCurrencyCode {
  return typeof value === "string" && (DISPLAY_CURRENCIES as readonly string[]).includes(value)
}

export function formatDisplayMoney(
  amount: number,
  code: DisplayCurrencyCode,
  options?: Intl.NumberFormatOptions,
): string {
  const defaults: Intl.NumberFormatOptions = {
    style: "currency",
    currency: code,
  }
  return new Intl.NumberFormat(LOCALE_BY_CODE[code], { ...defaults, ...options }).format(amount)
}
