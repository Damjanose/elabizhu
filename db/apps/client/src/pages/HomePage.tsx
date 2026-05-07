import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { ProductCard } from "../components/product/ProductCard"
import { fetchProducts } from "../services/products"

export const HomePage = () => {
  const { data: featured, isLoading: fLoad } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => fetchProducts({ featured: true }),
  })

  return (
    <div className="aurelia-home">
      <section className="aurelia-hero mb-5">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfrdXXDMvv_4i_QFR-cJQr4iUBQSgbhCXdTXoK6o6vnj5UenpWxIpHkaQsZ9XDXFy79XlmYCed9Tg-MDbQ5z4bw3OJHUd9z43VFF2qnAHg78HSf8OqAJs3PfFkAsuZBE8vqOsqP45J6NSvkjbSYGAHWLZw2mL1pwZI4IY_e6ttpbMG0153ZE4UC-w8PbSU97SwCKMnwbFmnr4bD4srvGTX4BYxqqM4vLnhyBIl9a8ppoXeS6g-WeYPDac1pcJhAFffPKEjfIGJDw"
          alt=""
          className="aurelia-hero-image"
        />
        <div className="aurelia-hero-overlay">
          <span className="aurelia-admin-kicker mb-3">Est. 1924</span>
          <h1 className="aurelia-hero-title">Timeless Jewellery, Curated Weekly</h1>
          <p className="aurelia-hero-copy">
            Discover a collection of handcrafted pieces that celebrate the art of fine jewellery.
          </p>
          <div className="d-flex gap-2 justify-content-center mt-3">
            <Link className="aurelia-btn aurelia-btn-primary text-decoration-none" to="/products">
              Shop Collection
            </Link>
            <Link className="aurelia-btn text-decoration-none" to="/products?featured=1">
              View New Arrivals
            </Link>
          </div>
        </div>
      </section>

      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <h2 className="aurelia-admin-title mb-2">The Signature Series</h2>
            <p className="aurelia-muted mb-0 small">Refined essentials for the modern connoisseur.</p>
          </div>
          <Link to="/products?featured=1" className="aurelia-nav-link">
            View all
          </Link>
        </div>
        {fLoad && <div className="alert alert-info py-2">Loading featured…</div>}
        <div className="row g-4">
          {featured?.slice(0, 4).map((p) => (
            <div key={p.id} className="col-6 col-lg-3">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      <section className="aurelia-feature-block mb-5">
        <div className="row g-4 align-items-center">
          <div className="col-md-5">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuANIPK2sA_DRxWB_X0cI9oci-WSe6NXAJqBeV5uM-oNM7loqG2k7g7pBlapLwp_wZ0OGa0R5npIpEr_XD2x6SU_bAp-g1C4KGl3UWFPuM8rO2rSEXdTBlWO_NA8AIjlf12oCTHnMehix8fRwglYRDYfBVhKfagn1YN0QkTILB3_eqtipyes0e1P19vkR6oMivth7PNQftjceEEOaZOXTFns8iInHoDjkLH2_WFlWb1Z8DfLkCbBl_DV6jrISOgov80h7lOFKCn4Gw"
              alt=""
              className="w-100 aurelia-feature-image"
            />
          </div>
          <div className="col-md-7">
            <h2 className="aurelia-admin-title mb-3">Celestial Craftsmanship</h2>
            <p className="aurelia-muted mb-4">
              Our newest arrivals bridge traditional techniques and contemporary design. Every piece
              in the Aurora collection features ethically sourced stones set in recycled gold.
            </p>
            <div className="row g-3">
              <div className="col-6">
                <h3 className="aurelia-feature-point">Ethically Sourced</h3>
                <p className="aurelia-muted small mb-0">Committed to transparency in our supply chain.</p>
              </div>
              <div className="col-6">
                <h3 className="aurelia-feature-point">Hand-Finished</h3>
                <p className="aurelia-muted small mb-0">Individually polished for a mirror-like shine.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-5">
        <h2 className="aurelia-admin-title text-center mb-4">Shop by Category</h2>
        <div className="row g-3">
          <div className="col-md-4">
            <Link className="aurelia-category-tile text-decoration-none" to="/categories">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUCHmTYIJOJ5wHsDpcxGrnB8IoZYhdRfeeEOL6loLp9RhZ-X75eABlbfi1VokYKsf0pPjpN6U5KDla5h4Tuv953JkrshABTw1QXla7fw1g08a762tuX0dmXjcQN8uUHRWoknYYm6n_UlXV-o1ZPZICFGzKPAzBBwf234FUqxli3IzAkMN-YddIlcPGd6uC3NVVmE10s76I_B28_vqguclGYE9UZcQQpdrFLWT2DzBvDQjV7UsFQAijDqK2YtGjcofRXHK482Jf1Q"
                alt=""
              />
              <span>Rings</span>
            </Link>
          </div>
          <div className="col-md-4">
            <Link className="aurelia-category-tile text-decoration-none" to="/categories">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDls09bXH9zpm_nvTZOOAJ0vui7QX-RrLm7V3zsv0cypbxpoP-mpePXuvn-4iRAqglr9MgQh9-UFYy_lHu4DORu1a-B0SWCOuKtePiA-3KnySf8WlvR5Dn4jK0xK0MefnMvXtaPhDSMFTIsZpOjWUwA7c1f9nzwkqQ4yyGzg13QcHr5UJdjZg3Zh9TnbDJ87v0Qa_ndGzHIvjIA-XqVLtvo1F6PUkXfPQxPEq3LZ2gK6EarnB_g9CXet91YiRy8Z-fpQ7ROordXoQ"
                alt=""
              />
              <span>Necklaces</span>
            </Link>
          </div>
          <div className="col-md-4">
            <Link className="aurelia-category-tile text-decoration-none" to="/account">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2a5NvgT3nw6nbJt-1nTW555XAN_2nqzoDEJlxE1Buz1a9wIlJwjMBKBPE3SYoVCgjcmMk73lmQxuFIPqwNxY3OO9d7cXTWP24To_WNRtfKhh2Mzw2pXUzPEJFOlK86EIc9epl5o5RrjnxrczcCgdgUkr3E9iqmuy4I98xXxl_tM6vVN7fY3_Af7o-WArja1GKsU4YSxs18tr7BxcMR-mgBaKTCTHd3zN6l2rK9Ar3eqFZLpezmxsR0dKM6YYD3ELNN6tanVCUPw"
                alt=""
              />
              <span>Bespoke</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="aurelia-newsletter text-center">
        <h2 className="aurelia-admin-title mb-2">Join the Aurelia Circle</h2>
        <p className="aurelia-muted mb-3">
          Be the first to explore our weekly curations, exclusive bespoke opportunities and private events.
        </p>
        <div className="d-flex justify-content-center gap-2 flex-wrap">
          <input type="email" className="aurelia-newsletter-input" placeholder="Your Email Address" />
          <button className="aurelia-btn aurelia-btn-primary">Subscribe</button>
        </div>
      </section>

    </div>
  )
}
