import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { Category, Product } from "@jewellery/types"
import { useParams } from "react-router-dom"
import { EmptyState } from "../components/feedback/EmptyState"
import { CategoryChips } from "../components/catalog/CategoryChips"
import { CatalogToolbar } from "../components/catalog/CatalogToolbar"
import {
  CatalogFilteredEmpty,
  CatalogGrid,
  CatalogGridSkeleton,
} from "../components/catalog/ProductCatalog"
import { useQueryLoadState } from "../hooks/useQueryLoadState"
import { useI18n } from "../i18n"
import { apiClient } from "../api/client"
import { applyCatalogFilters, defaultCatalogFilters, type CatalogFilters } from "../lib/catalog-filters"
import { queryKeys } from "../lib/query-keys"
import { queryTiming } from "../lib/query-client"
import "../styles/catalog.css"

export const CategoryProductsPage = () => {
  const { categoryId = "" } = useParams()
  const { t } = useI18n()
  const [filters, setFilters] = useState<CatalogFilters>(defaultCatalogFilters)

  const productsQuery = useQuery({
    queryKey: queryKeys.category.products(categoryId),
    queryFn: async () => {
      const { data: d } = await apiClient.get<Product[]>(`/categories/${categoryId}/products`)
      return d
    },
    enabled: !!categoryId,
    staleTime: queryTiming.catalogueStaleTime,
  })

  const categoryQuery = useQuery({
    queryKey: queryKeys.category.detail(categoryId),
    queryFn: async () => {
      const { data: d } = await apiClient.get<Category>(`/categories/${categoryId}`)
      return d
    },
    enabled: !!categoryId,
    staleTime: queryTiming.catalogueStaleTime,
  })
  const { showSkeleton: showProductsSkeleton } = useQueryLoadState(productsQuery)

  const products = productsQuery.data
  const visible = useMemo(() => applyCatalogFilters(products ?? [], filters), [products, filters])
  const total = products?.length

  const heading = categoryQuery.data?.name ?? t("catalog.category.fallbackTitle")

  let body
  if (showProductsSkeleton) {
    body = <CatalogGridSkeleton />
  } else if (productsQuery.isError) {
    body = (
      <EmptyState
        variant="card"
        tone="danger"
        icon="error"
        kicker={t("catalog.error.kicker")}
        title={t("catalog.error.categoryTitle")}
        copy={t("catalog.error.copy")}
        cta={{
          label: productsQuery.isFetching ? t("catalog.action.retrying") : t("catalog.action.tryAgain"),
          onClick: () => void productsQuery.refetch(),
        }}
        secondaryCta={{ to: "/categories", label: t("catalog.action.browseCategories") }}
      />
    )
  } else if (!products || products.length === 0) {
    body = (
      <EmptyState
        variant="card"
        icon="diamond"
        kicker={(categoryQuery.data?.name ?? t("catalog.categories.collection")).toUpperCase()}
        title={t("catalog.category.emptyTitle")}
        copy={t("catalog.category.emptyCopy")}
        cta={{ to: "/categories", label: t("catalog.action.browseCategories") }}
        secondaryCta={{ to: "/products", label: t("catalog.action.viewAllProducts") }}
      />
    )
  } else if (visible.length === 0) {
    body = (
      <CatalogFilteredEmpty onReset={() => setFilters({ ...defaultCatalogFilters, sort: filters.sort })} />
    )
  } else {
    body = <CatalogGrid products={visible} />
  }

  return (
    <div className="eb-cat-page">
      <header className="eb-cat-header">
        <p className="eb-cat-kicker">{t("catalog.categories.collection")}</p>
        <h1 className="eb-cat-title">{heading}</h1>
        {total !== undefined && (
          <p className="eb-cat-sub">
            {t(total === 1 ? "catalog.header.countOne" : "catalog.header.countOther", { count: total })}
          </p>
        )}
      </header>

      <CategoryChips currentCategoryId={categoryId} />
      <CatalogToolbar
        filters={filters}
        onChange={setFilters}
        resultCount={products ? visible.length : undefined}
      />
      {body}
    </div>
  )
}
