# Performance & UX Optimization Plan

## Overview
This document outlines optimization opportunities for the Aurelia Jewellery e-commerce frontend, covering both the client-facing store and admin dashboard from performance, UX, and code quality perspectives.

---

## 1. PERFORMANCE OPTIMIZATIONS

### 1.1 Bundle Size & Code Splitting
**Priority: HIGH**

#### Current State
- Using Vite with React 19, Tailwind 4, and multiple heavy libraries
- Motion animations (GSAP + react-spring + motion library) - potential duplication
- Recharts for dashboards (heavier than alternatives)

#### Recommendations
```
1. Analyze bundle size:
   - pnpm --filter @jewellery/client run build --analysis
   - Check for duplicate libraries (GSAP, motion, react-spring)

2. Remove animation library duplication:
   - Consolidate to single solution (recommend: `motion` or `framer-motion`)
   - Keep GSAP only if advanced animations needed
   - React-spring may be redundant

3. Implement route-based code splitting:
   - Lazy load admin routes: React.lazy() + Suspense
   - Lazy load category/product detail pages
   - Avoid loading admin bundles for customer users

4. Dynamic imports for heavy features:
   - Charts (Recharts) - load only in dashboard
   - Product catalog with filtering - code split from home page
```

#### Expected Impact
- Potential 20-30% reduction in initial bundle
- Admin users don't load customer UI code
- Faster TTI (Time to Interactive)

---

### 1.2 API Data Management & Caching
**Priority: HIGH**

#### Current Issues
- No pagination/cursor implementation visible
- Fetching all products/orders at once (scales poorly)
- No request deduplication
- Admin Dashboard fetches orders + products simultaneously

#### Recommendations

**A. Implement Pagination/Infinite Scroll**
```typescript
// Current (problematic for scale):
const { data } = useQuery({
  queryKey: ["products"],
  queryFn: () => fetchProducts()  // Gets ALL products
})

// Recommended:
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ["products"],
  queryFn: ({ pageParam = 1 }) => 
    fetchProducts({ page: pageParam, limit: 20 }),
  getNextPageParam: (lastPage) => lastPage.nextPage
})
```

**B. Setup React Query Config Globally**
```typescript
// Add staleTime and cacheTime configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)
    },
  },
})
```

**C. Implement Request Deduplication**
```typescript
// Prevent multiple simultaneous identical requests
// React Query does this, but ensure proper queryKey usage
// AdminDashboard example issue: queryKey: ["products", "admin-dashboard"]
// Could cause cache miss vs useCatalog hook with queryKey: ["products"]
```

**D. Selective Data Fetching in Admin**
```typescript
// Current: AdminDashboardPage fetches ALL orders and ALL products
// Recommended: Fetch only needed data with limits
const ordersQuery = useQuery({
  queryKey: ["orders", { limit: 4 }],  // Only recent 4
  queryFn: () => fetchOrders({ limit: 4 })
})

const productsQuery = useQuery({
  queryKey: ["products", { limit: 20 }],
  queryFn: () => fetchProducts({ limit: 20 })
})
```

#### Expected Impact
- 50-70% reduction in initial data transfer for large product catalogs
- Faster dashboard load
- Better memory usage on mobile

---

### 1.3 Image Optimization
**Priority: MEDIUM**

#### Current State
- Using unsplash hardcoded image in admin dashboard
- Lazy loading on product thumbnails (`loading="lazy"`)
- No WebP/modern format support visible

#### Recommendations

```typescript
// 1. Setup image service helper
export const getOptimizedImageUrl = (
  url: string,
  width: number,
  quality = 75
) => {
  // Use Imgix, Cloudinary, or self-hosted optimization
  // Example pattern:
  return `${CDN_URL}/${url}?w=${width}&q=${quality}&auto=format`
}

// 2. Create responsive image component
const ResponsiveImage = ({ src, alt }: Props) => (
  <img
    src={getOptimizedImageUrl(src, 400)}
    srcSet={`
      ${getOptimizedImageUrl(src, 300)} 300w,
      ${getOptimizedImageUrl(src, 600)} 600w,
      ${getOptimizedImageUrl(src, 1200)} 1200w
    `}
    sizes="(max-width: 600px) 100vw, 50vw"
    alt={alt}
    loading="lazy"
    decoding="async"
  />
)

// 3. Use in ProductCard and ProductDetailsPage
// 4. Consider next-gen formats (WebP with fallback)
```

#### Expected Impact
- 40-60% reduction in image file sizes
- Faster page loads, especially on mobile/slow networks

---

### 1.4 Skeleton Loading States
**Priority: MEDIUM**

#### Current State
- ✅ Recently added skeleton loading screens (good!)
- CSS shimmer animation implemented
- Some inconsistencies (EmptyState vs skeleton divs)

#### Recommendations

```typescript
// 1. Create reusable skeleton components (DRY principle)
// Instead of repeating skeleton JSX in every page:

// Current (repetitive):
<div className="aurelia-pdp-skeleton-line aurelia-shimmer-block" />
<div className="aurelia-pdp-skeleton-line aurelia-shimmer-block" />

// Better approach:
const ProductDetailsSkeleton = () => (
  <SkeletonLoader>
    <SkeletonLine width="42%" height="12px" className="aurelia-pdp-skeleton-line--kicker" />
    <SkeletonLine width="88%" height="40px" className="aurelia-pdp-skeleton-line--title" />
    <SkeletonLine width="36%" height="28px" className="aurelia-pdp-skeleton-line--price" />
  </SkeletonLoader>
)

// 2. Extract repeated patterns into components
// See: HomePage.tsx has FeaturedProductsSkeleton - follow this pattern
```

#### Expected Impact
- Better perceived performance (users see progress)
- Reduced code duplication
- Easier maintenance of loading states

---

### 1.5 Image Format & Lazy Loading Optimization
**Priority: MEDIUM**

#### Current Issues
- Admin dashboard uses hardcoded unsplash URL
- No image format optimization strategy

#### Recommendations

```typescript
// Use picture element for WebP with fallback:
<picture>
  <source 
    srcSet="/images/spotlight.webp?w=1200&q=80"
    type="image/webp"
  />
  <source 
    srcSet="/images/spotlight.jpg?w=1200&q=80"
    type="image/jpeg"
  />
  <img src="/images/spotlight.jpg" alt="Luxury necklace spotlight" />
</picture>
```

---

## 2. API & DATA LAYER IMPROVEMENTS

### 2.1 Request Interceptors & Error Handling
**Priority: HIGH**

#### Current State
```typescript
// api/client.ts is minimal - no error handling
export const apiClient = axios.create({
  baseURL: getEnv().apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
})
```

#### Recommendations

```typescript
// Enhance with interceptors
apiClient.interceptors.request.use((config) => {
  // Add auth token
  const token = authStore.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401: refresh token or redirect to login
    if (error.response?.status === 401) {
      authStore.logout()
      window.location.href = '/login'
    }
    // Handle rate limiting
    if (error.response?.status === 429) {
      // Implement exponential backoff retry
    }
    return Promise.reject(error)
  }
)
```

#### Expected Impact
- Automatic token refresh (better UX)
- Graceful error handling
- Rate limit awareness

---

### 2.2 Standardized Query/Mutation Patterns
**Priority: MEDIUM**

#### Current State
- Some inconsistency in service functions
- Manual loading/error states in some places

#### Recommendations

```typescript
// Create helper for common patterns:

interface FetchOptions<T> {
  retry?: number
  staleTime?: number
}

export const useApiQuery = <T,>(
  key: string[],
  fn: () => Promise<T>,
  options?: FetchOptions<T>
) => {
  return useQuery({
    queryKey: key,
    queryFn: fn,
    retry: options?.retry ?? 3,
    staleTime: options?.staleTime ?? 1000 * 60 * 5,
  })
}

// Use consistently across hooks
export const useProducts = (options?: FetchOptions<Product[]>) =>
  useApiQuery(
    ["products"],
    () => fetchProducts(),
    options
  )
```

---

## 3. ADMIN DASHBOARD SPECIFIC OPTIMIZATIONS

### 3.1 Dashboard Performance
**Priority: HIGH**

#### Current Issues
- AdminDashboardPage fetches ALL orders + ALL products at once
- AdminProductsPage does pagination but re-renders on every keystroke (debounced)
- No virtualization for long tables

#### Recommendations

**A. Optimize Dashboard Data Fetching**
```typescript
// Current problematic code:
const ordersQuery = useQuery({ 
  queryKey: ["orders"], 
  queryFn: fetchOrders  // Gets ALL orders
})
const productsQuery = useQuery({ 
  queryKey: ["products", "admin-dashboard"], 
  queryFn: () => fetchProducts()  // Gets ALL products
})

// Optimized:
const ordersQuery = useQuery({ 
  queryKey: ["orders", { limit: 4, sort: "recent" }],
  queryFn: () => fetchOrders({ limit: 4, sort: "createdAt:desc" })
})

const productsQuery = useQuery({ 
  queryKey: ["products", { limit: 10, filter: "low_stock" }],
  queryFn: () => fetchProducts({ 
    limit: 10, 
    filter: "stockQuantity<=lowStockThreshold" 
  })
})
```

**B. Implement Table Virtualization**
```typescript
// For AdminProductsPage with long lists:
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={48}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ProductRow product={items[index]} />
    </div>
  )}
</FixedSizeList>
```

**C. Batch Updates in Admin Tables**
```typescript
// Implement batch operations instead of single updates
const [selectedProducts, setSelectedProducts] = useState<string[]>([])

const bulkUpdateMutation = useMutation({
  mutationFn: (data) => updateProductsBatch(data),
  onSuccess: () => queryClient.invalidateQueries(['products'])
})
```

#### Expected Impact
- 50% faster dashboard load
- Smoother scrolling with 1000+ items
- Faster product filtering

---

### 3.2 Admin Sidebar & Navigation
**Priority: LOW**

#### Recommendations
- Implement lazy loading for admin menu items
- Cache navigation structure
- Add search/quick navigation (Command+K)

---

### 3.3 Real-time Updates
**Priority: MEDIUM**

#### Current State
- Socket.io client is set up but usage unclear
- No real-time order/inventory updates visible in admin

#### Recommendations

```typescript
// Implement socket listeners for:
socket.on('order:created', (order) => {
  queryClient.invalidateQueries({ queryKey: ['orders'] })
  toast.success('New order received')
})

socket.on('inventory:updated', (product) => {
  queryClient.setQueryData(
    ['product', product.id],
    product
  )
})

// Add real-time indicators:
<div className={isConnected ? 'is-connected' : 'is-disconnected'}>
  {isConnected ? '🟢 Live' : '🔴 Offline'}
</div>
```

#### Expected Impact
- Instant visibility of changes
- Better multi-user experience
- Reduced manual refresh need

---

## 4. CLIENT-SIDE STORE OPTIMIZATIONS

### 4.1 Zustand Store Structure
**Priority: MEDIUM**

#### Current State
- authStore is minimal (sessionReady flag only)
- Multiple separate stores (cart, product, notification, etc.)
- No store persistence visible

#### Recommendations

```typescript
// 1. Add store persistence for user preferences
export const useUIStore = create(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      theme: 'light',
      setTheme: (t) => set({ theme: t }),
    }),
    {
      name: 'ui-store',
      storage: localStorage,
    }
  )
)

// 2. Add hydration check
const useIsHydrated = () => {
  const [isHydrated, setIsHydrated] = useState(false)
  useEffect(() => setIsHydrated(true), [])
  return isHydrated
}

// Use in critical components:
if (!useIsHydrated()) return <LoadingPlaceholder />
```

#### Expected Impact
- Better user experience (preferences preserved)
- Reduced jank on page reload

---

## 5. ACCESSIBILITY & UX IMPROVEMENTS

### 5.1 ARIA Labels & Semantic HTML
**Priority: MEDIUM**

#### Current State
- Good: aria-busy, aria-live, aria-hidden on skeletons
- Missing: aria-labels on icon-only buttons
- Some nav items need role="navigation"

#### Recommendations

```typescript
// 1. Icon buttons need labels:
<button aria-label="Close dialog">
  <XIcon />
</button>

// 2. Tables need proper ARIA:
<table role="grid">
  <thead>
    <tr role="row">
      <th role="columnheader">Product</th>
    </tr>
  </thead>
</table>

// 3. Loading states (already good):
<div aria-busy="true" aria-live="polite">
  Loading...
</div>
```

#### Expected Impact
- Better accessibility for screen readers
- Better SEO
- WCAG 2.1 AA compliance

---

### 5.2 Form Validation & Error Messages
**Priority: MEDIUM**

#### Recommendations
- Use Formik's error display consistently
- Add `aria-invalid` and `aria-describedby` to inputs
- Show inline field-level errors

```typescript
<input
  aria-invalid={!!formik.errors.email}
  aria-describedby={formik.errors.email ? "email-error" : undefined}
/>
{formik.errors.email && (
  <div id="email-error" className="text-danger">
    {formik.errors.email}
  </div>
)}
```

---

## 6. BUILD & DEPLOYMENT OPTIMIZATIONS

### 6.1 Vite Configuration
**Priority: MEDIUM**

#### Recommendations

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Modern target for smaller bundles
    target: 'ES2020',
    // Chunk strategy
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'query': ['@tanstack/react-query'],
          'charts': ['recharts'],
        }
      }
    },
    // Reduce chunk size warnings
    chunkSizeWarningLimit: 500,
    minify: 'terser',
  },
  // Enable compression
  server: {
    compression: 'gzip',
  }
})
```

### 6.2 TypeScript Configuration
**Priority: LOW**

#### Current State
- Strict mode enabled ✅
- skipLibCheck enabled ✅

#### Recommendations
```json
{
  "compilerOptions": {
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "strict": true,
    // Add:
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

---

## 7. TESTING STRATEGY

### 7.1 Performance Testing
**Priority: MEDIUM**

```bash
# Add to package.json scripts
"perf:test": "vitest run performance",
"perf:lighthouse": "lighthouse https://localhost:3000"
```

### 7.2 E2E Testing for Admin Flows
**Priority: MEDIUM**

```typescript
// Example with Playwright:
test('admin can filter and paginate products', async ({ page }) => {
  await page.goto('/admin/products')
  await page.fill('input[placeholder="Search products"]', 'necklace')
  await page.waitForSelector('table tbody tr', { timeout: 5000 })
  expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0)
})
```

---

## IMPLEMENTATION ROADMAP

### Phase 1: Critical (Week 1-2)
- [ ] Remove animation library duplication
- [ ] Implement route-based code splitting
- [ ] Fix dashboard data fetching (limit queries)
- [ ] Add API request interceptors

### Phase 2: Important (Week 2-3)
- [ ] Implement infinite query pagination
- [ ] Add React Query global config
- [ ] Image optimization setup
- [ ] Admin table virtualization

### Phase 3: Enhancement (Week 3-4)
- [ ] Real-time socket updates
- [ ] Zustand store persistence
- [ ] Accessibility audit & fixes
- [ ] TypeScript strict checks

### Phase 4: Polish (Ongoing)
- [ ] Performance monitoring
- [ ] E2E test coverage
- [ ] Continuous optimization

---

## MONITORING & METRICS

Track these metrics post-optimization:

```typescript
// Lighthouse Scores Target
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+

// Core Web Vitals
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

// Custom Metrics
- Admin Dashboard Load Time: < 3s
- Product Search Latency: < 500ms
- Image Load Time: < 1s (avg)
```

---

## NOTES

- Run `pnpm --filter @jewellery/client run build --analysis` to verify bundle impact
- Test on mobile devices (Chrome DevTools throttling insufficient)
- Monitor real-world metrics with Sentry or similar
- Keep changelog of performance improvements
