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
import { EmptyState } from "../../components/feedback/EmptyState"
import { useCategories } from "../../hooks/useCatalog"
import {
  createProduct,
  deleteProduct,
  resolveMediaUrl,
  updateProduct,
  uploadMedia,
} from "../../services/admin"
import { fetchProduct } from "../../services/products"
import { useAdminDisplayCurrency } from "../../stores/adminDisplayCurrencyStore"
import { errorToast, successToast, toastFromError } from "../../utils/toast"

const URGENCY_OPTIONS: { value: UrgencyBadge; label: string }[] = [
  { value: "none", label: "None" },
  { value: "new", label: "New" },
  { value: "low_stock", label: "Low stock" },
  { value: "sold_out", label: "Sold out" },
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
  const displayCurrency = useAdminDisplayCurrency()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { productId } = useParams<{ productId: string }>()
  const isCreate = !productId

  const { data: categories } = useCategories()
  const productQuery = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId as string),
    enabled: !isCreate,
    retry: false,
  })

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

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const create = useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] })
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      successToast("Product created")
      navigate(`/admin/products/${created.id}`, { replace: true })
    },
    onError: (error) => toastFromError(error, "Could not create product"),
  })

  const patch = useMutation({
    mutationFn: (input: UpdateProductInput) => updateProduct(productId as string, input),
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["product", productId] }),
        queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ])
      setForm(productToForm(updated))
      successToast("Product saved")
    },
    onError: (error) => toastFromError(error, "Could not save product"),
  })

  const remove = useMutation({
    mutationFn: () => deleteProduct(productId as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] })
      successToast("Product deleted")
      navigate("/admin/products", { replace: true })
    },
    onError: (error) => toastFromError(error, "Could not delete product"),
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
          errorToast(`${file.name} is not an image`)
          continue
        }
        urls.push(result.url)
      }
      if (urls.length > 0) {
        setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...urls] }))
      }
    } catch (error) {
      toastFromError(error, "Image upload failed")
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
        errorToast("File is not a supported video")
        return
      }
      setForm((prev) => ({ ...prev, videoUrl: result.url }))
    } catch (error) {
      toastFromError(error, "Video upload failed")
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
      errorToast("Pick a category before saving")
      return
    }
    if (!form.name.trim()) {
      errorToast("Name is required")
      return
    }
    if (!form.price.trim()) {
      errorToast("Price is required")
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

  if (!isCreate && productQuery.isLoading) {
    return (
      <section className="aurelia-detail-shell">
        <EmptyState
          variant="page"
          icon="hourglass_empty"
          kicker="Loading"
          title="Retrieving product details..."
          copy="One moment while we pull the latest details."
        />
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
            kicker="Product Not Found"
            title="We couldn't locate this product"
            copy="The reference may be incorrect or the product no longer exists."
            cta={{ to: "/admin/products", label: "Back to Products" }}
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
          kicker="Something Went Wrong"
          title="Could not load this product"
          copy="An unexpected error interrupted our request. Please try again."
          cta={{
            label: productQuery.isFetching ? "Retrying..." : "Try Again",
            onClick: () => void productQuery.refetch(),
          }}
          secondaryCta={{ to: "/admin/products", label: "Back to Products" }}
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
        <span>Back to Products</span>
      </Link>

      <header className="aurelia-order-detail-hero">
        <div className="aurelia-order-detail-hero-meta">
          <span className="aurelia-order-detail-kicker">
            {isCreate ? "New piece" : "Product reference"}
          </span>
          <h1 className="aurelia-order-detail-ref">
            {isCreate ? "Create new product" : form.name || "Untitled product"}
          </h1>
          {!isCreate && productQuery.data && (
            <p className="aurelia-order-detail-placed">
              Created {new Date(productQuery.data.createdAt).toLocaleDateString("en-GB")}
              {" · "}Updated {new Date(productQuery.data.updatedAt).toLocaleDateString("en-GB")}
            </p>
          )}
        </div>
        <div className="aurelia-order-detail-hero-status">
          <span
            className={`aurelia-admin-status-chip ${form.isActive ? "is-success" : "is-muted"}`}
          >
            {form.isActive ? "Active" : "Archived"}
          </span>
          {form.featured && (
            <span className="aurelia-admin-status-chip is-info">Featured</span>
          )}
        </div>
      </header>

      <div className="aurelia-order-detail-grid">
        <div className="aurelia-order-detail-main">
          <article className="aurelia-order-detail-card">
            <header className="aurelia-order-detail-card-header">
              <h2 className="aurelia-order-detail-card-title">Identity</h2>
            </header>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="prod-name">
                  Name
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
                  Category
                </label>
                <select
                  id="prod-category"
                  className="form-select aurelia-admin-input"
                  value={form.categoryId}
                  onChange={(event) => updateField("categoryId", event.target.value)}
                >
                  <option value="">Select category...</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="prod-description">
                  Description
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
              <h2 className="aurelia-order-detail-card-title">Photos</h2>
              <span className="aurelia-order-detail-card-meta">
                {form.imageUrls.length} {form.imageUrls.length === 1 ? "photo" : "photos"}
              </span>
            </header>
            <div className="aurelia-admin-products-media-grid">
              {form.imageUrls.map((url, index) => (
                <div key={`${url}-${index}`} className="aurelia-admin-products-media-tile">
                  <img src={resolveMediaUrl(url)} alt="" loading="lazy" />
                  {index === 0 && (
                    <span className="aurelia-admin-products-media-cover">Cover</span>
                  )}
                  <div className="aurelia-admin-products-media-actions">
                    <button
                      type="button"
                      className="aurelia-admin-products-media-btn"
                      onClick={() => moveImage(index, -1)}
                      disabled={index === 0}
                      aria-label="Move up"
                    >
                      <span className="material-symbols-outlined">arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      className="aurelia-admin-products-media-btn"
                      onClick={() => moveImage(index, 1)}
                      disabled={index === form.imageUrls.length - 1}
                      aria-label="Move down"
                    >
                      <span className="material-symbols-outlined">arrow_downward</span>
                    </button>
                    <button
                      type="button"
                      className="aurelia-admin-products-media-btn is-danger"
                      onClick={() => removeImage(index)}
                      aria-label="Remove photo"
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
                <span>{imageUploading ? "Uploading..." : "Add photos"}</span>
                <small>JPG, PNG, WEBP up to 8MB</small>
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
              <h2 className="aurelia-order-detail-card-title">Video</h2>
              {form.videoUrl && (
                <button
                  type="button"
                  className="aurelia-btn aurelia-btn-soft-danger"
                  onClick={removeVideo}
                >
                  Remove video
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
                  {videoUploading ? "Uploading..." : "Replace video"}
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
                <span>{videoUploading ? "Uploading..." : "Add a video"}</span>
                <small>MP4, WEBM, MOV up to 100MB</small>
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
              <h2 className="aurelia-order-detail-card-title">Pricing & inventory</h2>
            </header>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label" htmlFor="prod-price">
                  Price ({displayCurrency})
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
                  Stock
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
                  Low-stock at
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
                  Urgency badge
                </label>
                <select
                  id="prod-badge"
                  className="form-select aurelia-admin-input"
                  value={form.urgencyBadge}
                  onChange={(event) =>
                    updateField("urgencyBadge", event.target.value as UrgencyBadge)
                  }
                >
                  {URGENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
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
                    Featured on storefront
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
                      Active (visible to customers)
                    </label>
                  </div>
                )}
              </div>
            </div>
          </article>

          {!isCreate && (
            <article className="aurelia-order-detail-card">
              <header className="aurelia-order-detail-card-header">
                <h2 className="aurelia-order-detail-card-title">Danger zone</h2>
              </header>
              <p className="aurelia-muted mb-3">
                Deleting a product removes it from the catalog. This action cannot be undone.
              </p>
              <button
                type="button"
                className="aurelia-btn aurelia-btn-solid-danger"
                onClick={() => setConfirmDelete(true)}
              >
                Delete product
              </button>
            </article>
          )}
        </aside>
      </div>

      <div className="aurelia-admin-products-save-bar" role="region" aria-label="Save changes">
        <span className="aurelia-admin-products-save-status">
          {isCreate
            ? "New products are saved as active by default."
            : isDirty
              ? "You have unsaved changes."
              : "All changes saved."}
        </span>
        <div className="aurelia-admin-products-save-actions">
          <button
            type="button"
            className="aurelia-btn aurelia-btn-outline"
            onClick={onDiscard}
            disabled={!isDirty || saving}
          >
            Discard
          </button>
          <button
            type="button"
            className="aurelia-btn aurelia-btn-primary"
            onClick={onSave}
            disabled={saving || (!isCreate && !isDirty)}
          >
            {saving ? "Saving..." : isCreate ? "Create product" : "Save changes"}
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
            <p className="aurelia-admin-kicker mb-2">Confirm deletion</p>
            <h3 id="admin-product-delete-title" className="aurelia-admin-card-title mb-2">
              Delete {form.name || "this product"}?
            </h3>
            <p className="aurelia-muted mb-3">
              The product will be removed from the catalog and pending orders.
            </p>
            <div className="aurelia-admin-confirm-actions">
              <button
                type="button"
                className="aurelia-btn aurelia-btn-outline"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
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
                {remove.isPending ? "Deleting..." : "Delete product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
