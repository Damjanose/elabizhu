import { useQuery } from "@tanstack/react-query"
import type { Category, Product } from "@jewellery/types"
import { apiClient } from "../../api/client"
import { queryKeys } from "../../lib/query-keys"
import { queryTiming } from "../../lib/query-client"

export const useCategoriesQuery = () =>
  useQuery({
    queryKey: queryKeys.categories(),
    queryFn: async () => {
      const { data } = await apiClient.get<Category[]>("/categories")
      return data
    },
    staleTime: queryTiming.catalogueStaleTime,
  })

export const useProductsQuery = () =>
  useQuery({
    queryKey: queryKeys.products.all(),
    queryFn: async () => {
      const { data } = await apiClient.get<Product[]>("/products")
      return data
    },
    staleTime: queryTiming.catalogueStaleTime,
  })
