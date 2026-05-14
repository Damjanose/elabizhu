import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "../../lib/query-keys"
import { queryTiming } from "../../lib/query-client"
import { fetchProducts } from "../../services/products"

export const useFeaturedProductsQuery = () =>
  useQuery({
    queryKey: queryKeys.products.featured(),
    queryFn: () => fetchProducts({ featured: true }),
    staleTime: queryTiming.catalogueStaleTime,
  })
