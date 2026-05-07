import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CartResponse, Product } from "@jewellery/types"
import { addToCart, fetchCart, removeCartLine, updateCartLine } from "../services/cart"
import { useCartStore } from "../stores/cartStore"
import { computeGuestSubtotal, useGuestCartStore } from "../stores/guestCartStore"
import { useAuth } from "../types/auth-context"

const EMPTY_CART: CartResponse = { items: [], subtotal: "0.00" }

export const useCart = () => {
  const { accessToken, user } = useAuth()
  const queryClient = useQueryClient()
  const touch = useCartStore((s) => s.touch)
  const guestItems = useGuestCartStore((s) => s.items)
  const guestAdd = useGuestCartStore((s) => s.addItem)
  const guestSetQty = useGuestCartStore((s) => s.setQuantity)
  const guestRemove = useGuestCartStore((s) => s.removeItem)

  const isAuthed = !!accessToken && !!user

  const serverQuery = useQuery({
    queryKey: ["cart"],
    queryFn: fetchCart,
    enabled: isAuthed,
  })

  const invalidateServer = () => {
    touch()
    void queryClient.invalidateQueries({ queryKey: ["cart"] })
  }

  const guestData = useMemo<CartResponse>(
    () => ({
      items: guestItems.map((line) => ({
        productId: line.productId,
        name: line.name,
        price: line.price,
        quantity: line.quantity,
        imageUrl: line.imageUrl,
      })),
      subtotal: computeGuestSubtotal(guestItems).toFixed(2),
    }),
    [guestItems],
  )

  const data: CartResponse = isAuthed ? (serverQuery.data ?? EMPTY_CART) : guestData

  const addItemMutation = useMutation({
    mutationFn: async ({ product, quantity }: { product: Product; quantity: number }) => {
      if (isAuthed) {
        await addToCart(product.id, quantity)
      } else {
        guestAdd(
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.images[0]?.url ?? null,
          },
          quantity,
        )
      }
    },
    onSuccess: () => {
      if (isAuthed) invalidateServer()
      else touch()
    },
  })

  const setQtyMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      if (isAuthed) {
        await updateCartLine(productId, quantity)
      } else {
        guestSetQty(productId, quantity)
      }
    },
    onSuccess: () => {
      if (isAuthed) invalidateServer()
      else touch()
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (isAuthed) {
        await removeCartLine(productId)
      } else {
        guestRemove(productId)
      }
    },
    onSuccess: () => {
      if (isAuthed) invalidateServer()
      else touch()
    },
  })

  const itemCount = data.items.reduce((sum, line) => sum + line.quantity, 0)

  return {
    data,
    isLoading: isAuthed ? serverQuery.isLoading : false,
    isFetching: isAuthed ? serverQuery.isFetching : false,
    isError: isAuthed ? serverQuery.isError : false,
    refetch: () => (isAuthed ? serverQuery.refetch() : Promise.resolve()),
    isGuest: !isAuthed,
    itemCount,
    addItem: addItemMutation.mutateAsync,
    setQty: setQtyMutation.mutateAsync,
    removeLine: removeMutation.mutateAsync,
    isUpdating:
      addItemMutation.isPending || setQtyMutation.isPending || removeMutation.isPending,
  }
}
