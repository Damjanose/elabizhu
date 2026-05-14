import { create } from "zustand"
import { persist } from "zustand/middleware"

type OrderState = {
  lastCheckoutId: string | null
  setLastCheckoutId: (id: string | null) => void
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      lastCheckoutId: null,
      setLastCheckoutId: (lastCheckoutId) => set({ lastCheckoutId }),
    }),
    { name: "aurelia-order-ui" },
  ),
)
