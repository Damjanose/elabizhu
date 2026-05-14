import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "../../lib/query-keys"
import { queryTiming } from "../../lib/query-client"
import { fetchProduct, fetchProductRecommendations } from "../../services/products"

export const useProductQuery = (
  productId: string,
  enabled = true,
  options?: { retry?: number | boolean },
) =>
  useQuery({
    queryKey: queryKeys.product.detail(productId),
    queryFn: () => fetchProduct(productId),
    enabled: enabled && !!productId,
    staleTime: queryTiming.catalogueStaleTime,
    retry: options?.retry,
  })

export const useProductRecommendationsQuery = (productId: string, enabled = true) =>
  useQuery({
    queryKey: queryKeys.product.recommendations(productId),
    queryFn: () => fetchProductRecommendations(productId, 8),
    enabled: enabled && !!productId,
    staleTime: queryTiming.catalogueStaleTime,
  })
