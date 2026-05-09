import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  DEFAULT_DISPLAY_CURRENCY,
  type DisplayCurrencyCode,
  isDisplayCurrencyCode,
} from "../lib/display-currency"

type AdminDisplayCurrencyState = {
  currency: DisplayCurrencyCode
  setCurrency: (currency: DisplayCurrencyCode) => void
}

export const useAdminDisplayCurrencyStore = create<AdminDisplayCurrencyState>()(
  persist(
    (set) => ({
      currency: DEFAULT_DISPLAY_CURRENCY,
      setCurrency: (currency) => set({ currency }),
    }),
    { name: "aurelia-admin-display-currency" },
  ),
)

/** Safe currency for UI: falls back if persisted state is invalid. */
export function useAdminDisplayCurrency(): DisplayCurrencyCode {
  const raw = useAdminDisplayCurrencyStore((s) => s.currency)
  return isDisplayCurrencyCode(raw) ? raw : DEFAULT_DISPLAY_CURRENCY
}
