import { Link } from "react-router-dom"
import { useCategories } from "../hooks/useCatalog"

const CATEGORY_IMAGES: Record<string, string> = {
  rings:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCUCHmTYIJOJ5wHsDpcxGrnB8IoZYhdRfeeEOL6loLp9RhZ-X75eABlbfi1VokYKsf0pPjpN6U5KDla5h4Tuv953JkrshABTw1QXla7fw1g08a762tuX0dmXjcQN8uUHRWoknYYm6n_UlXV-o1ZPZICFGzKPAzBBwf234FUqxli3IzAkMN-YddIlcPGd6uC3NVVmE10s76I_B28_vqguclGYE9UZcQQpdrFLWT2DzBvDQjV7UsFQAijDqK2YtGjcofRXHK482Jf1Q",
  necklaces:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDls09bXH9zpm_nvTZOOAJ0vui7QX-RrLm7V3zsv0cypbxpoP-mpePXuvn-4iRAqglr9MgQh9-UFYy_lHu4DORu1a-B0SWCOuKtePiA-3KnySf8WlvR5Dn4jK0xK0MefnMvXtaPhDSMFTIsZpOjWUwA7c1f9nzwkqQ4yyGzg13QcHr5UJdjZg3Zh9TnbDJ87v0Qa_ndGzHIvjIA-XqVLtvo1F6PUkXfPQxPEq3LZ2gK6EarnB_g9CXet91YiRy8Z-fpQ7ROordXoQ",
  bespoke:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC2a5NvgT3nw6nbJt-1nTW555XAN_2nqzoDEJlxE1Buz1a9wIlJwjMBKBPE3SYoVCgjcmMk73lmQxuFIPqwNxY3OO9d7cXTWP24To_WNRtfKhh2Mzw2pXUzPEJFOlK86EIc9epl5o5RrjnxrczcCgdgUkr3E9iqmuy4I98xXxl_tM6vVN7fY3_Af7o-WArja1GKsU4YSxs18tr7BxcMR-mgBaKTCTHd3zN6l2rK9Ar3eqFZLpezmxsR0dKM6YYD3ELNN6tanVCUPw",
  earrings:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAo2MNHPjNApEvX4EK-1CPzW6KquzByyMnpyYkuPGLMNQKrWy5DZJ6rlIbK4Wgyjo1hRGZIHzYD1xQRexlA2J3JzGk2p_X9YD7FUy5MYEgsFq_PP8S7WEnpBJKy6ZcXaFE0GQg_FQpr9JyDxnjukCbqnDNn1sp3PpuXfYTYyUQaKUbNu4qKTPEOh7vdzO_lalbSnPZ-Ids5bxPntPwaXgL5D9K6rlA83SEkthWhf-9HqEWYH9CArGvjbjeA8obhem3EyIo0ysT8vg",
  bracelets:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCnTfeR_lUVCBmZ4WhiKn2I-Ekj2eaqACvPgDQSJbWDX9oKs-d2EAJhdZcImNwG3vbvagpBEHrzt6QmkVJzPS5dFEtbrAteyyeAksulFXOU4oy3VnAtRbcga97Ab-ZVGoW5Sf4ZETLWaKGPj1iO7d2e558YLpOMmX_MduLQyUc2Jq9xpIJBdsYsgfZCxHyinuBvw-BIURqoY4QDEBrV6-tD-BGTl_Z-vpXu0zRNOpt1wqAAPqw8ft8uaVKdDtovpABB041q24nuBg",
  pendants:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAjzAfwYgJe5rFKn65DcSc_yTqaNuebmb3Q7HLIdU1HefUvw7V9yB54RgX3j7TO56CYjPUCTRgK3SiCfjUVHJpXrZBB3HbkuiWKZgl7u2JT14nPBPlvr2dvA4XDWDBX5tGBBxwQMAaSy425ufrv94XujUy4unatdCl6tPXYcg3gIxkUdLfncgZcx4jiBU67f8zAx-UfZfvjLNK69X2xgvppqAm5r_kXQ3CFLb4PGnK_MsQsXG-hqcXH54naqzzc07LR8tEDWk3S0g",
}

const FALLBACK_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuANIPK2sA_DRxWB_X0cI9oci-WSe6NXAJqBeV5uM-oNM7loqG2k7g7pBlapLwp_wZ0OGa0R5npIpEr_XD2x6SU_bAp-g1C4KGl3UWFPuM8rO2rSEXdTBlWO_NA8AIjlf12oCTHnMehix8fRwglYRDYfBVhKfagn1YN0QkTILB3_eqtipyes0e1P19vkR6oMivth7PNQftjceEEOaZOXTFns8iInHoDjkLH2_WFlWb1Z8DfLkCbBl_DV6jrISOgov80h7lOFKCn4Gw"

const imageFor = (name: string) => CATEGORY_IMAGES[name.toLowerCase().trim()] ?? FALLBACK_IMAGE

export const CategoriesPage = () => {
  const { data, isLoading, isError } = useCategories()

  return (
    <section className="py-12 md:py-20">
      <header className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
        <span className="aurelia-admin-kicker mb-3 d-inline-block">Aurelia Atelier</span>
        <h1 className="font-display-xl text-headline-lg font-normal mb-4 mt-2">Shop by Category</h1>
        <p className="aurelia-muted mb-0">
          Pick a category to explore pieces crafted with intention by our master artisans.
        </p>
      </header>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="aspect-square bg-surface-container animate-pulse"
              aria-hidden
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center aurelia-muted py-5">
          Could not load categories. Please refresh and try again.
        </div>
      )}

      {!isLoading && !isError && data && data.length === 0 && (
        <div className="text-center aurelia-muted py-5">No categories available yet.</div>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {data.map((category) => (
            <Link
              key={category.id}
              to={`/categories/${category.id}/products`}
              className="relative group block aspect-square overflow-hidden bg-surface-dim"
              style={{ color: "#fff8f3", textDecoration: "none" }}
              aria-label={`Browse ${category.name}`}
            >
              <img
                src={imageFor(category.name)}
                alt={category.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-[1000ms] group-hover:scale-110"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-on-background/15 group-hover:bg-on-background/30 transition-colors"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <h2
                  className="font-display-xl text-headline-md tracking-widest uppercase font-normal m-0"
                  style={{ color: "#fff8f3" }}
                >
                  {category.name}
                </h2>
                <span
                  className="font-body-md text-label-sm uppercase tracking-widest border-b pb-1 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500"
                  style={{ color: "rgba(255,248,243,0.8)", borderColor: "rgba(255,248,243,0.6)" }}
                >
                  Explore Collection
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="text-center mt-12 md:mt-16">
        <Link to="/products" className="aurelia-btn aurelia-btn-primary text-decoration-none">
          View All Products
        </Link>
      </div>
    </section>
  )
}
