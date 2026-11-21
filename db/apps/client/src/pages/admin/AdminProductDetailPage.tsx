import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Link, useNavigate, useParams } from "react-router-dom"
import type {
  CreateProductInput,
  Product,
  UpdateProductInput,
  UrgencyBadge,
} from "@jewellery/types"
import { AureliaCustomSelect } from "../../components/forms/AureliaCustomSelect"
import { EmptyState } from "../../components/feedback/EmptyState"
import { useCategories } from "../../hooks/useCatalog"
import { useProductQuery } from "../../hooks/queries/useProductQueries"
import { useQueryLoadState } from "../../hooks/useQueryLoadState"
import { queryKeys } from "../../lib/query-keys"
import {
  createProduct,
  deleteProduct,
  resolveMediaUrl,
  updateProduct,
  uploadMedia,
} from "../../services/admin"
import { useAdminDisplayCurrency } from "../../stores/adminDisplayCurrencyStore"
import { errorToast, successToast, toastFromError } from "../../utils/toast"
import { useI18n } from "../../i18n"

const URGENCY_OPTIONS: { value: UrgencyBadge; labelKey: string }[] = [
  { value: "none", labelKey: "admin.productDetail.urgency.none" },
  { value: "new", labelKey: "admin.productDetail.urgency.new" },
  { value: "low_stock", labelKey: "admin.productDetail.urgency.lowStock" },
  { value: "sold_out", labelKey: "admin.productDetail.urgency.soldOut" },
]

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif"
const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime"

type FormState = {
  categoryId: string
  name: string
  description: string
  price: string
  stockQuantity: number
  lowStockThreshold: number
  urgencyBadge: UrgencyBadge
  featured: boolean
  isActive: boolean
  imageUrls: string[]
  videoUrl: string | null
}

const emptyForm: FormState = {
  categoryId: "",
  name: "",
  description: "",
  price: "",
  stockQuantity: 0,
  lowStockThreshold: 5,
  urgencyBadge: "none",
  featured: false,
  isActive: true,
  imageUrls: [],
  videoUrl: null,
}

const productToForm = (product: Product): FormState => ({
  categoryId: product.categoryId,
  name: product.name,
  description: product.description ?? "",
  price: product.price,
  stockQuantity: product.stockQuantity,
  lowStockThreshold: product.lowStockThreshold,
  urgencyBadge: product.urgencyBadge,
  featured: product.featured,
  isActive: product.isActive,
  imageUrls: product.images.map((image) => image.url),
  videoUrl: product.videoUrl,
})

export const AdminProductDetailPage = () => {
  const { t, lang } = useI18n()
  const locale = lang === "sq" ? "sq-AL" : "en-GB"
  const displayCurrency = useAdminDisplayCurrency()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { productId } = useParams<{ productId: string }>()
  const isCreate = !productId

  const { data: categories } = useCategories()
  const productQuery = useProductQuery(productId ?? "", !isCreate, { retry: false })
  const { showSkeleton: showProductSkeleton } = useQueryLoadState(productQuery)

  const [form, setForm] = useState<FormState>(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [videoUploading, setVideoUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isCreate) {
      setForm(emptyForm)
      return
    }
    if (productQuery.data) {
      setForm(productToForm(productQuery.data))
    }
  }, [isCreate, productQuery.data])

  const baseline = useMemo<FormState>(() => {
    if (isCreate) return emptyForm
    return productQuery.data ? productToForm(productQuery.data) : emptyForm
  }, [isCreate, productQuery.data])

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline])

  const categorySelectOptions = useMemo(
    () => [
      { value: "", label: t("admin.productDetail.selectCategory") },
      ...(categories?.map((c) => ({ value: c.id, label: c.name })) ?? []),
    ],
    [categories, t],
  )

  const urgencySelectOptions = useMemo(
    () => URGENCY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t],
  )

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const create = useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.products({}) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.all() })
      successToast(t("admin.productDetail.created"))
      navigate(`/admin/products/${created.id}`, { replace: true })
    },
    onError: (error) => toastFromError(error, t("admin.productDetail.createFailed")),
  })

  const patch = useMutation({
    mutationFn: (input: UpdateProductInput) => updateProduct(productId as string, input),
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.product.detail(productId ?? "") }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.products({}) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all() }),
      ])
      setForm(productToForm(updated))
      successToast(t("admin.productDetail.saved"))
    },
    onError: (error) => toastFromError(error, t("admin.productDetail.saveFailed")),
  })

  const remove = useMutation({
    mutationFn: () => deleteProduct(productId as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.products({}) })
      successToast(t("admin.productDetail.deleted"))
      navigate("/admin/products", { replace: true })
    },
    onError: (error) => toastFromError(error, t("admin.productDetail.deleteFailed")),
  })

  const uploadImages = async (files: FileList | File[]) => {
    const arr = Array.from(files)
    if (arr.length === 0) return
    setImageUploading(true)
    try {
      const urls: string[] = []
      for (const file of arr) {
        const result = await uploadMedia(file)
        if (result.kind !== "image") {
          errorToast(t("admin.productDetail.notImage", { name: file.name }))
          continue
        }
        urls.push(result.url)
      }
      if (urls.length > 0) {
        setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...urls] }))
      }
    } catch (error) {
      toastFromError(error, t("admin.productDetail.imageUploadFailed"))
    } finally {
      setImageUploading(false)
      if (imageInputRef.current) imageInputRef.current.value = ""
    }
  }

  const uploadVideo = async (file: File) => {
    setVideoUploading(true)
    try {
      const result = await uploadMedia(file)
      if (result.kind !== "video") {
        errorToast(t("admin.productDetail.notVideo"))
        return
      }
      setForm((prev) => ({ ...prev, videoUrl: result.url }))
    } catch (error) {
      toastFromError(error, t("admin.productDetail.videoUploadFailed"))
    } finally {
      setVideoUploading(false)
      if (videoInputRef.current) videoInputRef.current.value = ""
    }
  }

  const moveImage = (index: number, direction: -1 | 1) => {
    setForm((prev) => {
      const next = [...prev.imageUrls]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return { ...prev, imageUrls: next }
    })
  }

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }))
  }

  const removeVideo = () => updateField("videoUrl", null)

  const onSave = () => {
    if (!form.categoryId) {
      errorToast(t("admin.productDetail.pickCategory"))
      return
    }
    if (!form.name.trim()) {
      errorToast(t("admin.productDetail.nameRequired"))
      return
    }
    if (!form.price.trim()) {
      errorToast(t("admin.productDetail.priceRequired"))
      return
    }

    if (isCreate) {
      const input: CreateProductInput = {
        categoryId: form.categoryId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: form.price.trim(),
        stockQuantity: form.stockQuantity,
        lowStockThreshold: form.lowStockThreshold,
        urgencyBadge: form.urgencyBadge,
        featured: form.featured,
        imageUrls: form.imageUrls,
        videoUrl: form.videoUrl,
      }
      void create.mutateAsync(input)
      return
    }

    const input: UpdateProductInput = {
      categoryId: form.categoryId,
      name: form.name.trim(),
      description: form.description.trim() ? form.description.trim() : undefined,
      price: form.price.trim(),
      stockQuantity: form.stockQuantity,
      lowStockThreshold: form.lowStockThreshold,
      urgencyBadge: form.urgencyBadge,
      featured: form.featured,
      isActive: form.isActive,
      imageUrls: form.imageUrls,
      videoUrl: form.videoUrl,
    }
    void patch.mutateAsync(input)
  }

  const onDiscard = () => setForm(baseline)

  const saving = create.isPending || patch.isPending

  if (!isCreate && showProductSkeleton) {
    return (
      <section className="aurelia-detail-shell" aria-busy="true" aria-live="polite" aria-label={t("admin.productDetail.loadingAria")}>
        <div className="aurelia-detail-skeleton-back aurelia-shimmer-block" aria-hidden />
        <div className="aurelia-detail-skeleton-hero" aria-hidden>
          <div>
            <div className="aurelia-detail-skeleton-line aurelia-detail-skeleton-line--short aurelia-shimmer-block" />
            <div className="aurelia-detail-skeleton-line aurelia-detail-skeleton-line--title aurelia-shimmer-block" />
            <div className="aurelia-detail-skeleton-line aurelia-detail-skeleton-line--short aurelia-shimmer-block" />
          </div>
        </div>
        <div className="aurelia-detail-skeleton-card aurelia-shimmer-block" aria-hidden />
        <div className="aurelia-detail-skeleton-card aurelia-shimmer-block" aria-hidden />
      </section>
    )
  }

  if (!isCreate && (productQuery.isError || !productQuery.data)) {
    const status = isAxiosError(productQuery.error)
      ? productQuery.error.response?.status
      : undefined
    if (status === 404) {
      return (
        <section className="aurelia-detail-shell">
          <EmptyState
            variant="page"
            icon="search_off"
            kicker={t("admin.productDetail.notFoundKicker")}
            title={t("admin.productDetail.notFoundTitle")}
            copy={t("admin.productDetail.notFoundCopy")}
            cta={{ to: "/admin/products", label: t("admin.productDetail.backToProducts") }}
          />
        </section>
      )
    }
    return (
      <section className="aurelia-detail-shell">
        <EmptyState
          variant="page"
          icon="error"
          tone="danger"
          kicker={t("admin.orderDetail.errorKicker")}
          title={t("admin.productDetail.errorTitle")}
          copy={t("admin.orderDetail.errorCopy")}
          cta={{
            label: productQuery.isFetching ? t("admin.common.retrying") : t("admin.common.tryAgain"),
            onClick: () => void productQuery.refetch(),
          }}
          secondaryCta={{ to: "/admin/products", label: t("admin.productDetail.backToProducts") }}
        />
      </section>
    )
  }

  return (
    <section className="aurelia-order-detail aurelia-admin-product-detail">
      <Link to="/admin/products" className="aurelia-order-detail-back">
        <span className="material-symbols-outlined" aria-hidden>
          chevron_left
        </span>
        <span>{t("admin.productDetail.backToProducts")}</span>
      </Link>

      <header className="aurelia-order-detail-hero">
        <div className="aurelia-order-detail-hero-meta">
          <span className="aurelia-order-detail-kicker">
            {isCreate ? t("admin.productDetail.newPiece") : t("admin.productDetail.reference")}
          </span>
          <h1 className="aurelia-order-detail-ref">
            {isCreate ? t("admin.productDetail.createTitle") : form.name || t("admin.productDetail.untitled")}
          </h1>
          {!isCreate && productQuery.data && (
            <p className="aurelia-order-detail-placed">
              {t("admin.productDetail.createdUpdated", {
                created: new Date(productQuery.data.createdAt).toLocaleDateString(locale),
                updated: new Date(productQuery.data.updatedAt).toLocaleDateString(locale),
              })}
            </p>
          )}
        </div>
        <div className="aurelia-order-detail-hero-status">
          <span
            className={`aurelia-admin-status-chip ${form.isActive ? "is-success" : "is-muted"}`}
          >
            {form.isActive ? t("admin.products.active") : t("admin.products.archived")}
          </span>
          {form.featured && (
            <span className="aurelia-admin-status-chip is-info">{t("admin.products.featured")}</span>
          )}
        </div>
      </header>

      <div className="aurelia-order-detail-grid">
        <div className="aurelia-order-detail-main">
          <article className="aurelia-order-detail-card">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">{t("admin.productDetail.identity")}</h2>
            </header>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="prod-name">
                  {t("admin.productDetail.name")}
                </label>
                <input
                  id="prod-name"
                  className="form-control aurelia-admin-input"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="prod-category">
                  {t("admin.products.category")}
                </label>
                <AureliaCustomSelect
                  id="prod-category"
                  value={form.categoryId}
                  onChange={(v) => updateField("categoryId", v)}
                  options={categorySelectOptions}
                  placeholder={t("admin.productDetail.selectCategory")}
                />
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="prod-description">
                  {t("admin.productDetail.description")}
                </label>
                <textarea
                  id="prod-description"
                  className="form-control aurelia-admin-input"
                  rows={4}
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                />
              </div>
            </div>
          </article>

          <article className="aurelia-order-detail-card">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">{t("admin.productDetail.photos")}</h2>
              <span className="aurelia-order-detail-card-meta">
                {t(form.imageUrls.length === 1 ? "admin.productDetail.photosOne" : "admin.productDetail.photosMany", { count: form.imageUrls.length })}
              </span>
            </header>
            <div className="aurelia-admin-products-media-grid">
              {form.imageUrls.map((url, index) => (
                <div key={`${url}-${index}`} className="aurelia-admin-products-media-tile">
                  <img src={resolveMediaUrl(url)} alt="" loading="lazy" />
                  {index === 0 && (
                    <span className="aurelia-admin-products-media-cover">{t("admin.productDetail.cover")}</span>
                  )}
                  <div className="aurelia-admin-products-media-actions">
                    <button
                      type="button"
                      className="aurelia-admin-products-media-btn"
                      onClick={() => moveImage(index, -1)}
                      disabled={index === 0}
                      aria-label={t("admin.productDetail.moveUp")}
                    >
                      <span className="material-symbols-outlined">arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      className="aurelia-admin-products-media-btn"
                      onClick={() => moveImage(index, 1)}
                      disabled={index === form.imageUrls.length - 1}
                      aria-label={t("admin.productDetail.moveDown")}
                    >
                      <span className="material-symbols-outlined">arrow_downward</span>
                    </button>
                    <button
                      type="button"
                      className="aurelia-admin-products-media-btn is-danger"
                      onClick={() => removeImage(index)}
                      aria-label={t("admin.productDetail.removePhoto")}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="aurelia-admin-products-dropzone"
                onClick={() => imageInputRef.current?.click()}
                disabled={imageUploading}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  {imageUploading ? "hourglass_top" : "add_photo_alternate"}
                </span>
                <span>{imageUploading ? t("admin.common.uploading") : t("admin.productDetail.addPhotos")}</span>
                <small>{t("admin.productDetail.photoFormats")}</small>
              </button>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              multiple
              hidden
              onChange={(event) => {
                if (event.target.files) void uploadImages(event.target.files)
              }}
            />
          </article>

          <article className="aurelia-order-detail-card">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">{t("admin.productDetail.video")}</h2>
              {form.videoUrl && (
                <button
                  type="button"
                  className="aurelia-btn aurelia-btn-soft-danger"
                  onClick={removeVideo}
                >
                  {t("admin.productDetail.removeVideo")}
                </button>
              )}
            </header>
            {form.videoUrl ? (
              <div className="aurelia-admin-products-video-preview">
                <video controls preload="metadata" src={resolveMediaUrl(form.videoUrl)} />
                <button
                  type="button"
                  className="aurelia-btn aurelia-btn-outline"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={videoUploading}
                >
                  {videoUploading ? t("admin.common.uploading") : t("admin.productDetail.replaceVideo")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="aurelia-admin-products-dropzone is-wide"
                onClick={() => videoInputRef.current?.click()}
                disabled={videoUploading}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  {videoUploading ? "hourglass_top" : "movie"}
                </span>
                <span>{videoUploading ? t("admin.common.uploading") : t("admin.productDetail.addVideo")}</span>
                <small>{t("admin.productDetail.videoFormats")}</small>
              </button>
            )}
            <input
              ref={videoInputRef}
              type="file"
              accept={VIDEO_ACCEPT}
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void uploadVideo(file)
              }}
            />
          </article>
        </div>

        <aside className="aurelia-order-detail-aside">
          <article className="aurelia-order-detail-card">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">{t("admin.productDetail.pricingInventory")}</h2>
            </header>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label" htmlFor="prod-price">
                  {t("admin.productDetail.priceLabel", { currency: displayCurrency })}
                </label>
                <input
                  id="prod-price"
                  className="form-control aurelia-admin-input"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(event) => updateField("price", event.target.value)}
                />
              </div>
              <div className="col-6">
                <label className="form-label" htmlFor="prod-stock">
                  {t("admin.productDetail.stock")}
                </label>
                <input
                  id="prod-stock"
                  type="number"
                  min={0}
                  className="form-control aurelia-admin-input"
                  value={form.stockQuantity}
                  onChange={(event) =>
                    updateField("stockQuantity", Math.max(0, Number(event.target.value) || 0))
                  }
                />
              </div>
              <div className="col-6">
                <label className="form-label" htmlFor="prod-low-threshold">
                  {t("admin.productDetail.lowStockAt")}
                </label>
                <input
                  id="prod-low-threshold"
                  type="number"
                  min={0}
                  className="form-control aurelia-admin-input"
                  value={form.lowStockThreshold}
                  onChange={(event) =>
                    updateField("lowStockThreshold", Math.max(0, Number(event.target.value) || 0))
                  }
                />
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="prod-badge">
                  {t("admin.productDetail.urgencyBadge")}
                </label>
                <AureliaCustomSelect
                  id="prod-badge"
                  value={form.urgencyBadge}
                  onChange={(v) => updateField("urgencyBadge", v as UrgencyBadge)}
                  options={urgencySelectOptions}
                  placeholder={t("admin.productDetail.selectBadge")}
                />
              </div>
              <div className="col-12">
                <div className="form-check">
                  <input
                    id="prod-featured"
                    type="checkbox"
                    className="form-check-input"
                    checked={form.featured}
                    onChange={(event) => updateField("featured", event.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="prod-featured">
                    {t("admin.productDetail.featuredOnStore")}
                  </label>
                </div>
                {!isCreate && (
                  <div className="form-check mt-2">
                    <input
                      id="prod-active"
                      type="checkbox"
                      className="form-check-input"
                      checked={form.isActive}
                      onChange={(event) => updateField("isActive", event.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="prod-active">
                      {t("admin.productDetail.activeVisible")}
                    </label>
                  </div>
                )}
              </div>
            </div>
          </article>

          {!isCreate && (
            <article className="aurelia-order-detail-card">
              <header className="aurelia-order-detail-card-header">
                <h2 className="aurelia-order-detail-card-title">{t("admin.productDetail.dangerZone")}</h2>
              </header>
              <p className="aurelia-muted mb-3">
                {t("admin.productDetail.deleteWarning")}
              </p>
              <button
                type="button"
                className="aurelia-btn aurelia-btn-solid-danger"
                onClick={() => setConfirmDelete(true)}
              >
                {t("admin.productDetail.deleteProduct")}
              </button>
            </article>
          )}
        </aside>
      </div>

      <div className="aurelia-admin-products-save-bar" role="region" aria-label={t("admin.productDetail.saveRegionAria")}>
        <span className="aurelia-admin-products-save-status">
          {isCreate
            ? t("admin.productDetail.statusNew")
            : isDirty
              ? t("admin.productDetail.statusUnsaved")
              : t("admin.productDetail.statusSaved")}
        </span>
        <div className="aurelia-admin-products-save-actions">
          <button
            type="button"
            className="aurelia-btn aurelia-btn-outline"
            onClick={onDiscard}
            disabled={!isDirty || saving}
          >
            {t("admin.productDetail.discard")}
          </button>
          <button
            type="button"
            className="aurelia-btn aurelia-btn-primary"
            onClick={onSave}
            disabled={saving || (!isCreate && !isDirty)}
          >
            {saving ? t("admin.common.saving") : isCreate ? t("admin.productDetail.createProduct") : t("admin.productDetail.saveChanges")}
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div
          className="aurelia-admin-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-product-delete-title"
        >
          <div className="aurelia-admin-confirm-modal">
            <p className="aurelia-admin-kicker mb-2">{t("admin.productDetail.confirmDeletion")}</p>
            <h3 id="admin-product-delete-title" className="aurelia-admin-card-title mb-2">
              {form.name ? t("admin.productDetail.deleteTitle", { name: form.name }) : t("admin.productDetail.deleteTitleFallback")}
            </h3>
            <p className="aurelia-muted mb-3">
              {t("admin.productDetail.deleteBody")}
            </p>
            <div className="aurelia-admin-confirm-actions">
              <button
                type="button"
                className="aurelia-btn aurelia-btn-outline"
                onClick={() => setConfirmDelete(false)}
              >
                {t("admin.common.cancel")}
              </button>
              <button
                type="button"
                className="aurelia-btn aurelia-btn-solid-danger"
                onClick={() => {
                  setConfirmDelete(false)
                  void remove.mutateAsync()
                }}
                disabled={remove.isPending}
              >
                {remove.isPending ? t("admin.common.deleting") : t("admin.productDetail.deleteProduct")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
