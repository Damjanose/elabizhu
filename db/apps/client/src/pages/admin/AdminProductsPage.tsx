import { useEffect, useMemo, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { FiSearch } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import type { Product, UrgencyBadge } from "@jewellery/types"
import { AureliaCustomSelect } from "../../components/forms/AureliaCustomSelect"
import { EmptyState } from "../../components/feedback/EmptyState"
import { useCategories } from "../../hooks/useCatalog"
import { useDebouncedValue } from "../../hooks/useDebouncedValue"
import { useQueryLoadState } from "../../hooks/useQueryLoadState"
import { queryKeys } from "../../lib/query-keys"
import { queryTiming } from "../../lib/query-client"
import { formatDisplayMoney } from "../../lib/display-currency"
import { fetchAdminProducts, resolveMediaUrl } from "../../services/admin"
import { useAdminDisplayCurrency } from "../../stores/adminDisplayCurrencyStore"
import { useI18n } from "../../i18n"

const PAGE_SIZE = 20

const BADGE_LABEL_KEY: Record<UrgencyBadge, string> = {
  none: "admin.products.badge.none",
  new: "admin.products.badge.new",
  low_stock: "admin.products.badge.lowStock",
  sold_out: "admin.products.badge.soldOut",
}

const BADGE_TONE: Record<UrgencyBadge, string> = {
  none: "is-muted",
  new: "is-info",
  low_stock: "is-warning",
  sold_out: "is-danger",
}

const productThumb = (product: Product) => {
  const first = product.images[0]?.url
  return first ? resolveMediaUrl(first) : null
}

export const AdminProductsPage = () => {
  const navigate = useNavigate()
  const { t } = useI18n()
  const displayCurrency = useAdminDisplayCurrency()
  const { data: categories } = useCategories()

  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, categoryId])

  const queryParams = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      page,
      limit: PAGE_SIZE,
      categoryId: categoryId || undefined,
    }),
    [debouncedSearch, page, categoryId],
  )

  const productsQuery = useQuery({
    queryKey: queryKeys.admin.products(queryParams),
    queryFn: () => fetchAdminProducts(queryParams),
    placeholderData: keepPreviousData,
    staleTime: queryTiming.sessionStaleTime,
  })
  const { data, isFetching } = productsQuery
  const { showSkeleton } = useQueryLoadState(productsQuery)

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const limit = data?.limit ?? PAGE_SIZE
  const currentPage = data?.page ?? page
  const startIndex = total === 0 ? 0 : (currentPage - 1) * limit + 1
  const endIndex = total === 0 ? 0 : Math.min(total, startIndex + items.length - 1)
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const canPrev = currentPage > 1
  const canNext = currentPage < totalPages

  const categoryName = (id: string) => categories?.find((c) => c.id === id)?.name ?? "—"

  const categoryFilterOptions = useMemo(
    () => [
      { value: "", label: t("admin.products.allCategories") },
      ...(categories?.map((c) => ({ value: c.id, label: c.name })) ?? []),
    ],
    [categories, t],
  )

  const goToProduct = (productId: string) => navigate(`/admin/products/${productId}`)

  const onRowKey = (event: React.KeyboardEvent<HTMLTableRowElement>, productId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      goToProduct(productId)
    }
  }

  return (
    <div className="aurelia-admin-page">
      <div className="aurelia-admin-page-header">
        <div>
          <p className="aurelia-admin-kicker mb-2">{t("admin.products.kicker")}</p>
          <h1 className="aurelia-admin-title mb-0">{t("admin.products.title")}</h1>
        </div>
        <button
          type="button"
          className="aurelia-btn aurelia-btn-primary"
          onClick={() => navigate("/admin/products/new")}
        >
          {t("admin.common.newProduct")}
        </button>
      </div>

      <section className="aurelia-admin-orders-section">
        <div className="aurelia-admin-products-toolbar">
          <label className="aurelia-admin-products-search" aria-label={t("admin.products.searchAria")}>
            <FiSearch aria-hidden />
            <input
              type="search"
              placeholder={t("admin.products.searchPlaceholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className="aurelia-admin-products-filter">
            <label className="form-label mb-0" htmlFor="admin-products-category">
              {t("admin.products.category")}
            </label>
            <AureliaCustomSelect
              id="admin-products-category"
              value={categoryId}
              onChange={setCategoryId}
              options={categoryFilterOptions}
              placeholder={t("admin.products.allCategories")}
            />
          </div>
        </div>

        <div className="table-responsive aurelia-admin-table-wrap aurelia-admin-orders-table-wrap">
          <table className="table align-middle mb-0 aurelia-admin-table aurelia-admin-orders-table">
            <thead>
              <tr>
                <th style={{ width: 64 }} aria-label={t("admin.table.image")} />
                <th>{t("admin.table.product")}</th>
                <th>{t("admin.table.category")}</th>
                <th>{t("admin.table.price")}</th>
                <th>{t("admin.table.stock")}</th>
                <th>{t("admin.table.badge")}</th>
                <th>{t("admin.table.status")}</th>
              </tr>
            </thead>
            <tbody>
              {showSkeleton && items.length === 0
                ? Array.from({ length: 6 }, (_, index) => (
                    <tr key={index} aria-hidden>
                      <td>
                        <div className="aurelia-admin-products-thumb is-skeleton aurelia-shimmer-block" />
                      </td>
                      <td colSpan={6}>
                        <div className="aurelia-admin-table-skeleton-cell aurelia-shimmer-block" />
                      </td>
                    </tr>
                  ))
                : items.map((product) => {
                const thumb = productThumb(product)
                const lowStock =
                  product.stockQuantity <= product.lowStockThreshold && product.stockQuantity > 0
                return (
                  <tr
                    key={product.id}
                    className="aurelia-admin-orders-row aurelia-admin-orders-row--clickable"
                    role="link"
                    tabIndex={0}
                    onClick={() => goToProduct(product.id)}
                    onKeyDown={(event) => onRowKey(event, product.id)}
                    aria-label={t("admin.products.openProduct", { name: product.name })}
                  >
                    <td>
                      <div className="aurelia-admin-products-thumb" aria-hidden>
                        {thumb ? (
                          <img src={thumb} alt="" loading="lazy" />
                        ) : (
                          <span className="material-symbols-outlined">diamond</span>
                        )}
                      </div>
                    </td>
                    <td className="aurelia-admin-orders-piece">
                      <strong>{product.name}</strong>
                      <span>
                        {product.description
                          ? product.description.length > 80
                            ? `${product.description.slice(0, 80)}…`
                            : product.description
                          : t("admin.products.noDescription")}
                      </span>
                    </td>
                    <td>{categoryName(product.categoryId)}</td>
                    <td className="fw-medium">
                      {formatDisplayMoney(Number(product.price || 0), displayCurrency, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      <span
                        className={`aurelia-admin-products-stock ${
                          product.stockQuantity === 0 ? "is-out" : lowStock ? "is-low" : ""
                        }`}
                      >
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`aurelia-admin-status-chip ${BADGE_TONE[product.urgencyBadge]}`}
                      >
                        {t(BADGE_LABEL_KEY[product.urgencyBadge])}
                      </span>
                    </td>
                    <td>
                      <div className="aurelia-admin-products-flags">
                        {product.featured && (
                          <span className="aurelia-admin-products-flag is-featured">{t("admin.products.featured")}</span>
                        )}
                        <span
                          className={`aurelia-admin-products-flag ${
                            product.isActive ? "is-active" : "is-archived"
                          }`}
                        >
                          {product.isActive ? t("admin.products.active") : t("admin.products.archived")}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {!showSkeleton && total === 0 && (
            <div className="aurelia-admin-products-empty">
              <EmptyState
                variant="inline"
                icon="inventory_2"
                kicker={t("admin.products.emptyKicker")}
                title={debouncedSearch || categoryId ? t("admin.products.noMatches") : t("admin.products.noProducts")}
                copy={
                  debouncedSearch || categoryId
                    ? t("admin.products.tryDifferent")
                    : t("admin.products.addFirst")
                }
                cta={
                  debouncedSearch || categoryId
                    ? {
                        label: t("admin.products.clearFilters"),
                        onClick: () => {
                          setSearch("")
                          setCategoryId("")
                        },
                      }
                    : { label: t("admin.common.newProduct"), onClick: () => navigate("/admin/products/new") }
                }
              />
            </div>
          )}

          <div className="aurelia-admin-table-foot aurelia-admin-orders-foot">
            <span>
              {total === 0
                ? showSkeleton || isFetching
                  ? t("admin.products.preparing")
                  : t("admin.products.showingNone")
                : t(total === 1 ? "admin.products.showingOne" : "admin.products.showingMany", { from: startIndex, to: endIndex, total })}
            </span>
            <div className="aurelia-admin-orders-pager" role="navigation" aria-label={t("admin.products.pagination")}>
              <button
                type="button"
                className="aurelia-admin-orders-pager-btn"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!canPrev}
                aria-label={t("admin.products.prevPage")}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="aurelia-admin-products-pager-page" aria-live="polite">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="aurelia-admin-orders-pager-btn"
                onClick={() => setPage((current) => current + 1)}
                disabled={!canNext}
                aria-label={t("admin.products.nextPage")}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
