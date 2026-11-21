import { useMemo } from "react"
import type { Product } from "@jewellery/types"
import { useProductsQuery } from "./queries/useCatalogQueries"

/** First available product photo per category (lowest sortOrder image of the first product that has one). */
export const buildCategoryCovers = (products: Product[] | undefined): Map<string, string> => {
  const covers = new Map<string, string>()
  for (const product of products ?? []) {
    if (covers.has(product.categoryId)) continue
    const image = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0]
    if (image?.url) covers.set(product.categoryId, image.url)
  }
  return covers
}

export const useCategoryCovers = (): Map<string, string> => {
  const { data } = useProductsQuery()
  return useMemo(() => buildCategoryCovers(data), [data])
}
