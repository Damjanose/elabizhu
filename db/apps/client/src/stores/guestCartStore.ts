import { create } from "zustand"
import { persist } from "zustand/middleware"

export type GuestCartLine = {
  productId: string
  name: string
  price: string
  quantity: number
  imageUrl: string | null
}

type GuestCartState = {
  items: GuestCartLine[]
  addItem: (line: Omit<GuestCartLine, "quantity">, quantity: number) => void
  setQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
}

const STORAGE_KEY = "aurelia_guest_cart"

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (line, quantity) => {
        const safeQty = Math.max(1, Math.floor(quantity || 1))
        set((state) => {
          const existing = state.items.find((i) => i.productId === line.productId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === line.productId
                  ? { ...i, quantity: i.quantity + safeQty }
                  : i,
              ),
            }
          }
          return {
            items: [
              ...state.items,
              {
                productId: line.productId,
                name: line.name,
                price: line.price,
                imageUrl: line.imageUrl,
                quantity: safeQty,
              },
            ],
          }
        })
      },
      setQuantity: (productId, quantity) => {
        const safeQty = Math.max(0, Math.floor(quantity || 0))
        set((state) => ({
          items:
            safeQty <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) =>
                  i.productId === productId ? { ...i, quantity: safeQty } : i,
                ),
        }))
      },
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    { name: STORAGE_KEY },
  ),
)

export const computeGuestSubtotal = (items: GuestCartLine[]) =>
  items.reduce((sum, line) => sum + Number(line.price) * line.quantity, 0)
