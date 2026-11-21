import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { CategoryChips } from "../components/catalog/CategoryChips"
import { CatalogToolbar } from "../components/catalog/CatalogToolbar"
import {
  CatalogFilteredEmpty,
  CatalogGrid,
  CatalogGridSkeleton,
  useCatalogProductsQuery,
} from "../components/catalog/ProductCatalog"
import { EmptyState } from "../components/feedback/EmptyState"
import { useQueryLoadState } from "../hooks/useQueryLoadState"
import { useI18n } from "../i18n"
import { applyCatalogFilters, defaultCatalogFilters, type CatalogFilters } from "../lib/catalog-filters"
import "../styles/catalog.css"

export const ProductsPage = () => {
  const [params] = useSearchParams()
  const featuredOnly = params.get("featured") === "1"
  const { t } = useI18n()
  const [filters, setFilters] = useState<CatalogFilters>(defaultCatalogFilters)

  const productsQuery = useCatalogProductsQuery(featuredOnly)
  const { showSkeleton } = useQueryLoadState(productsQuery)
  const { data, isError, isFetching, refetch } = productsQuery
  const visible = useMemo(() => applyCatalogFilters(data ?? [], filters), [data, filters])

  let body
  if (showSkeleton) {
    body = <CatalogGridSkeleton />
  } else if (isError) {
    body = (
      <EmptyState
        variant="card"
        tone="danger"
        icon="error"
        kicker={t("catalog.error.kicker")}
        title={t("catalog.error.catalogueTitle")}
        copy={t("catalog.error.copy")}
        cta={{
          label: isFetching ? t("catalog.action.retrying") : t("catalog.action.tryAgain"),
          onClick: () => void refetch(),
        }}
        secondaryCta={{ to: "/", label: t("catalog.action.returnHome") }}
      />
    )
  } else if (!data || data.length === 0) {
    body = (
      <EmptyState
        variant="card"
        icon="auto_awesome"
        kicker={featuredOnly ? t("catalog.empty.featuredKicker") : t("catalog.empty.catalogueKicker")}
        title={featuredOnly ? t("catalog.empty.featuredTitle") : t("catalog.empty.allTitle")}
        copy={featuredOnly ? t("catalog.empty.featuredCopy") : t("catalog.empty.allCopy")}
        cta={featuredOnly ? { to: "/collections", label: t("catalog.action.viewAllProducts") } : undefined}
        secondaryCta={{ to: "/categories", label: t("catalog.action.shopByCategory") }}
      />
    )
  } else if (visible.length === 0) {
    body = <CatalogFilteredEmpty onReset={() => setFilters({ ...defaultCatalogFilters, sort: filters.sort })} />
  } else {
    body = <CatalogGrid products={visible} />
  }

  return (
    <div className="eb-cat-page">
      <header className="eb-cat-header">
        <h1 className="eb-cat-title">
          {featuredOnly ? t("catalog.products.featuredTitle") : t("catalog.products.allTitle")}
        </h1>
      </header>

      <CategoryChips />
      <CatalogToolbar filters={filters} onChange={setFilters} resultCount={data ? visible.length : undefined} />
      {body}
    </div>
  )
}
