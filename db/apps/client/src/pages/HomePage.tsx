import { useFeaturedProductsQuery } from "../hooks/queries/useFeaturedProducts"
import { useCategories } from "../hooks/useCatalog"
import { useQueryLoadState } from "../hooks/useQueryLoadState"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { motion } from "motion/react"
import { useEffect, useMemo, useRef } from "react"
import { MotionLink, linkPressProps } from "../components/motion/MotionLink"
import { fadeUp, listItem, listStagger, scrollRevealViewport, shouldReduceMotion, transition } from "../lib/motion"
import { ProductCard } from "../components/product/ProductCard"

const CATEGORY_TILES = [
  {
    label: "Rings",
    to: "/categories",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCUCHmTYIJOJ5wHsDpcxGrnB8IoZYhdRfeeEOL6loLp9RhZ-X75eABlbfi1VokYKsf0pPjpN6U5KDla5h4Tuv953JkrshABTw1QXla7fw1g08a762tuX0dmXjcQN8uUHRWoknYYm6n_UlXV-o1ZPZICFGzKPAzBBwf234FUqxli3IzAkMN-YddIlcPGd6uC3NVVmE10s76I_B28_vqguclGYE9UZcQQpdrFLWT2DzBvDQjV7UsFQAijDqK2YtGjcofRXHK482Jf1Q",
  },
  {
    label: "Necklaces",
    to: "/categories",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDls09bXH9zpm_nvTZOOAJ0vui7QX-RrLm7V3zsv0cypbxpoP-mpePXuvn-4iRAqglr9MgQh9-UFYy_lHu4DORu1a-B0SWCOuKtePiA-3KnySf8WlvR5Dn4jK0xK0MefnMvXtaPhDSMFTIsZpOjWUwA7c1f9nzwkqQ4yyGzg13QcHr5UJdjZg3Zh9TnbDJ87v0Qa_ndGzHIvjIA-XqVLtvo1F6PUkXfPQxPEq3LZ2gK6EarnB_g9CXet91YiRy8Z-fpQ7ROordXoQ",
  },
  {
    label: "Bespoke",
    to: "/categories",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC2a5NvgT3nw6nbJt-1nTW555XAN_2nqzoDEJlxE1Buz1a9wIlJwjMBKBPE3SYoVCgjcmMk73lmQxuFIPqwNxY3OO9d7cXTWP24To_WNRtfKhh2Mzw2pXUzPEJFOlK86EIc9epl5o5RrjnxrczcCgdgUkr3E9iqmuy4I98xXxl_tM6vVN7fY3_Af7o-WArja1GKsU4YSxs18tr7BxcMR-mgBaKTCTHd3zN6l2rK9Ar3eqFZLpezmxsR0dKM6YYD3ELNN6tanVCUPw",
  },
] as const

export const HomePage = () => {
  const heroRef = useRef<HTMLElement | null>(null)
  const featuredQuery = useFeaturedProductsQuery()
  const categoriesQuery = useCategories()
  const featured = featuredQuery.data
  const { showSkeleton: showFeaturedSkeleton } = useQueryLoadState(featuredQuery)

  const categoryRoutes = useMemo(() => {
    const mapping = new Map<string, string>()
    categoriesQuery.data?.forEach((category) => {
      mapping.set(category.name.toLowerCase(), category.id)
    })
    return mapping
  }, [categoriesQuery.data])

  const categoryTiles = useMemo(
    () =>
      CATEGORY_TILES.map((tile) => {
        const categoryId = categoryRoutes.get(tile.label.toLowerCase())
        return {
          ...tile,
          to: categoryId ? `/categories/${categoryId}/products` : tile.to,
        }
      }),
    [categoryRoutes],
  )

  useEffect(() => {
    if (!heroRef.current || shouldReduceMotion()) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".aurelia-hero-overlay",
        { yPercent: 18, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out" },
      )

      gsap.fromTo(
        ".aurelia-hero-image",
        { scale: 1.08, yPercent: -4 },
        {
          scale: 1,
          yPercent: 6,
          ease: "none",
          scrollTrigger: {
            trigger: ".aurelia-hero",
            scrub: true,
            start: "top top",
            end: "bottom top",
          },
        },
      )
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <motion.div className="aurelia-home" variants={fadeUp} initial="hidden" animate="visible">
      <section className="aurelia-hero mb-5" ref={heroRef}>
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfrdXXDMvv_4i_QFR-cJQr4iUBQSgbhCXdTXoK6o6vnj5UenpWxIpHkaQsZ9XDXFy79XlmYCed9Tg-MDbQ5z4bw3OJHUd9z43VFF2qnAHg78HSf8OqAJs3PfFkAsuZBE8vqOsqP45J6NSvkjbSYGAHWLZw2mL1pwZI4IY_e6ttpbMG0153ZE4UC-w8PbSU97SwCKMnwbFmnr4bD4srvGTX4BYxqqM4vLnhyBIl9a8ppoXeS6g-WeYPDac1pcJhAFffPKEjfIGJDw"
          alt=""
          className="aurelia-hero-image"
          decoding="async"
          fetchPriority="high"
        />
        <div className="aurelia-hero-overlay">
          <span className="aurelia-admin-kicker mb-3">Est. 1924</span>
          <h1 className="aurelia-hero-title">Timeless Jewellery, Curated Weekly</h1>
          <p className="aurelia-hero-copy">
            Discover a collection of handcrafted pieces that celebrate the art of fine jewellery.
          </p>
          <div className="d-flex gap-2 justify-content-center mt-3">
            <MotionLink
              className="aurelia-btn aurelia-btn-primary text-decoration-none"
              to="/products"
              {...linkPressProps}
            >
              Shop Collection
            </MotionLink>
            <MotionLink
              className="aurelia-btn text-decoration-none"
              to="/products?featured=1"
              {...linkPressProps}
            >
              View New Arrivals
            </MotionLink>
          </div>
        </div>
      </section>

      <section className="mb-5">
        <motion.div
          className="d-flex justify-content-between align-items-end mb-4"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={scrollRevealViewport}
        >
          <div>
            <h2 className="aurelia-admin-title mb-2">The Signature Series</h2>
            <p className="aurelia-muted mb-0 small">Refined essentials for the modern connoisseur.</p>
          </div>
          <MotionLink to="/products?featured=1" className="aurelia-nav-link" {...linkPressProps}>
            View all
          </MotionLink>
        </motion.div>
        {showFeaturedSkeleton ? (
          <FeaturedProductsSkeleton />
        ) : featured && featured.length > 0 ? (
          <motion.div
            key={featured
              .slice(0, 4)
              .map((p) => p.id)
              .join("-")}
            className="row g-4"
            variants={listStagger}
            initial="hidden"
            animate="visible"
          >
            {featured.slice(0, 4).map((p) => (
              <motion.div key={p.id} className="col-6 col-lg-3" variants={listItem}>
                <ProductCard product={p} eagerImage />
              </motion.div>
            ))}
          </motion.div>
        ) : null}
      </section>

      <section className="aurelia-feature-block mb-5">
        <div className="row g-4 align-items-center">
          <motion.div
            className="col-md-5 overflow-hidden"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={scrollRevealViewport}
          >
            <motion.img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuANIPK2sA_DRxWB_X0cI9oci-WSe6NXAJqBeV5uM-oNM7loqG2k7g7pBlapLwp_wZ0OGa0R5npIpEr_XD2x6SU_bAp-g1C4KGl3UWFPuM8rO2rSEXdTBlWO_NA8AIjlf12oCTHnMehix8fRwglYRDYfBVhKfagn1YN0QkTILB3_eqtipyes0e1P19vkR6oMivth7PNQftjceEEOaZOXTFns8iInHoDjkLH2_WFlWb1Z8DfLkCbBl_DV6jrISOgov80h7lOFKCn4Gw"
              alt=""
              className="w-100 aurelia-feature-image"
              loading="lazy"
              decoding="async"
              whileHover={{ scale: 1.04 }}
              transition={transition.slow}
            />
          </motion.div>
          <motion.div
            className="col-md-7"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={scrollRevealViewport}
          >
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
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <motion.h2
          className="font-display-xl text-headline-lg text-center mb-16 font-normal"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={scrollRevealViewport}
        >
          Shop by Category
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-gutter"
          variants={listStagger}
          initial="hidden"
          whileInView="visible"
          viewport={scrollRevealViewport}
        >
          {categoryTiles.map((tile, index) => (
            <motion.div key={tile.label} variants={listItem}>
            <MotionLink
              key={tile.label}
              to={tile.to}
              className="relative group block aspect-square overflow-hidden bg-surface-dim"
              style={{ color: "#fff8f3", textDecoration: "none" }}
              whileHover={{ scale: 1.015, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={transition.base}
            >
              <motion.img
                src={tile.image}
                alt={tile.label}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                whileHover={{ scale: 1.08 }}
                transition={transition.slow}
              />

              <div
                aria-hidden
                className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-95"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(20,16,10,0.20) 0%, rgba(20,16,10,0) 32%, rgba(20,16,10,0) 50%, rgba(20,16,10,0.88) 100%)",
                }}
              />

              <div className="absolute inset-x-0 bottom-0 px-6 pb-6 md:px-8 md:pb-8">
                <span
                  className="block text-[11px] uppercase tracking-[0.32em] mb-3"
                  style={{ color: "rgba(255,248,243,0.72)", fontFamily: "Inter, sans-serif" }}
                >
                  {String(index + 1).padStart(2, "0")} &nbsp;·&nbsp; Collection
                </span>

                <div className="flex items-end justify-between gap-4">
                  <h3
                    className="m-0 font-normal leading-none text-[28px] md:text-[36px] lg:text-[40px] tracking-wide"
                    style={{ color: "#fff8f3", fontFamily: '"Noto Serif", serif' }}
                  >
                    {tile.label}
                  </h3>
                  <span
                    aria-hidden
                    className="text-2xl leading-none transition-transform duration-500 ease-out group-hover:translate-x-1.5"
                    style={{ color: "#fff8f3", fontWeight: 200 }}
                  >
                    →
                  </span>
                </div>

                <span
                  aria-hidden
                  className="mt-5 block h-px w-8 group-hover:w-full transition-all duration-700 ease-out"
                  style={{ background: "rgba(255,248,243,0.6)" }}
                />
              </div>
            </MotionLink>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="aurelia-newsletter text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={scrollRevealViewport}
        >
          <h2 className="aurelia-admin-title mb-2">Join the ElaBizhu Circle</h2>
          <p className="aurelia-muted mb-3">
            Be the first to explore our weekly curations, exclusive bespoke opportunities and private events.
          </p>
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <input type="email" className="aurelia-newsletter-input" placeholder="Your Email Address" />
            <motion.button
              type="button"
              className="aurelia-btn aurelia-btn-primary"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={transition.quick}
            >
              Subscribe
            </motion.button>
          </div>
        </motion.div>
      </section>

    </motion.div>
  )
}

const FeaturedProductsSkeleton = () => (
  <motion.div
    className="row g-4"
    aria-busy="true"
    aria-live="polite"
    aria-label="Loading featured products"
    variants={listStagger}
    initial="hidden"
    animate="visible"
  >
    {[0, 1, 2, 3].map((i) => (
      <motion.div key={i} className="col-6 col-lg-3" variants={listItem}>
        <motion.div className="aurelia-product-skeleton" aria-hidden />
      </motion.div>
    ))}
  </motion.div>
)
