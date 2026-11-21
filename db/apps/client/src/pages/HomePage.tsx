import { useEffect, useMemo, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { motion, type Variants } from "motion/react"
import { Link } from "react-router-dom"
import { FiInstagram } from "react-icons/fi"
import { FaTiktok } from "react-icons/fa"
import { useFeaturedProductsQuery } from "../hooks/queries/useFeaturedProducts"
import { useCategories } from "../hooks/useCatalog"
import { useQueryLoadState } from "../hooks/useQueryLoadState"
import { useI18n } from "../i18n"
import { MotionLink, linkPressProps } from "../components/motion/MotionLink"
import { BadgePill } from "../components/product/BadgePill"
import { fadeUp, listItem, listStagger, scrollRevealViewport, shouldReduceMotion, transition } from "../lib/motion"
import { deriveDisplayBadge } from "../utils/productBadges"
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, TIKTOK_URL, instagramPosts } from "../data/instagram"
import { HOME_CATEGORIES, matchHomeCategory } from "./home-categories"
import "../styles/home.css"

const heroStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}

const heroRise: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: transition.slow },
}

const STEP_KEYS = [1, 2, 3] as const
const GALLERY_SLOTS = 6

/** Scroll-reveal props; empty when the user prefers reduced motion so content renders immediately. */
const revealProps = (reduce: boolean) =>
  reduce ? {} : { variants: fadeUp, initial: "hidden", whileInView: "visible", viewport: scrollRevealViewport }

export const HomePage = () => {
  const { t } = useI18n()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const reduceMotion = useMemo(() => shouldReduceMotion(), [])
  const featuredQuery = useFeaturedProductsQuery()
  const categoriesQuery = useCategories()
  const featured = featuredQuery.data
  const { showSkeleton: showFeaturedSkeleton } = useQueryLoadState(featuredQuery)

  const products = useMemo(() => (featured ?? []).slice(0, 8), [featured])
  const heroImage = useMemo(() => featured?.find((p) => p.images[0])?.images[0]?.url, [featured])

  const categoryTiles = useMemo(() => {
    const list = categoriesQuery.data ?? []
    return HOME_CATEGORIES.map(({ key }) => {
      const match = matchHomeCategory(key, list)
      return { key, to: match ? `/categories/${match.id}/products` : "/categories" }
    })
  }, [categoriesQuery.data])

  const watchesTo = categoryTiles.find((tile) => tile.key === "watches")?.to ?? "/categories"

  useEffect(() => {
    if (!rootRef.current || shouldReduceMotion()) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.to(".eb-home-hero-img", {
        yPercent: 6,
        ease: "none",
        scrollTrigger: { trigger: ".eb-home-hero", start: "top top", end: "bottom top", scrub: true },
      })

      gsap.fromTo(
        ".eb-home-band-quote",
        { yPercent: -10 },
        {
          yPercent: 10,
          ease: "none",
          scrollTrigger: { trigger: ".eb-home-band", start: "top bottom", end: "bottom top", scrub: true },
        },
      )
    }, rootRef)

    return () => ctx.revert()
  }, [])

  const reveal = revealProps(reduceMotion)

  return (
    <div className="eb-home" ref={rootRef}>
      <div className="eb-home-marquee" aria-hidden>
        <div className="eb-home-marquee-track">
          {[0, 1].map((group) => (
            <span className="eb-home-marquee-group" key={group}>
              <span>{t("home.marquee.style")}</span>
              <span>{t("home.marquee.material")}</span>
              <span>{t("home.marquee.shipping")}</span>
            </span>
          ))}
        </div>
      </div>

      <section className="eb-home-hero" aria-labelledby="eb-home-hero-title">
        <motion.div
          className="eb-home-hero-text"
          variants={heroStagger}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
        >
          <motion.span className="eb-home-kicker" variants={heroRise}>
            {t("home.hero.kicker")}
          </motion.span>
          <motion.h1 id="eb-home-hero-title" className="eb-home-hero-title" variants={heroRise}>
            {t("home.hero.titleStart")}
            <br />
            <em>{t("home.hero.titleEnd")}</em>
          </motion.h1>
        </motion.div>

        <motion.div
          className="eb-home-hero-media"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition.slow}
        >
          {heroImage ? (
            <img
              src={heroImage}
              alt={t("home.hero.imageAlt")}
              className="eb-home-hero-img"
              decoding="async"
              fetchPriority="high"
            />
          ) : (
            <span className="eb-home-hero-img eb-home-shimmer" aria-hidden>
              <span className="eb-home-placeholder-label">{t("home.hero.placeholder")}</span>
            </span>
          )}
        </motion.div>

        <motion.div
          className="eb-home-hero-body"
          variants={heroStagger}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
        >
          <motion.p className="eb-home-hero-copy" variants={heroRise}>
            {t("home.hero.copy")}
          </motion.p>
          <motion.div className="eb-home-actions" variants={heroRise}>
            <MotionLink to="/products" className="eb-home-pill" {...linkPressProps}>
              {t("home.hero.shop")}
            </MotionLink>
            <motion.a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="eb-home-pill eb-home-pill--outline"
              {...linkPressProps}
            >
              <FiInstagram aria-hidden />
              Instagram
            </motion.a>
            <motion.a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="eb-home-pill eb-home-pill--outline"
              {...linkPressProps}
            >
              <FaTiktok aria-hidden />
              TikTok
            </motion.a>
          </motion.div>
        </motion.div>
      </section>

      <nav className="eb-home-chips-wrap" aria-label={t("home.categories.title")}>
        <ul className="eb-home-chips">
          {categoryTiles.map((tile) => (
            <li key={tile.key}>
              <Link className="eb-home-chip" to={tile.to}>
                {t(`home.categories.name.${tile.key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className="eb-home-section" aria-labelledby="eb-home-categories-title">
        <motion.h2 id="eb-home-categories-title" className="eb-home-h2 eb-home-section-title" {...reveal}>
          {t("home.categories.title")}
        </motion.h2>
        <motion.ul className="eb-home-cat-grid" variants={listStagger} initial={reduceMotion ? false : "hidden"} whileInView="visible" viewport={scrollRevealViewport}>
          {categoryTiles.map((tile) => (
            <motion.li key={tile.key} variants={listItem} className="eb-home-cat-item">
              <Link to={tile.to} className="eb-home-cat eb-home-shimmer">
                <span className="eb-home-cat-name">{t(`home.categories.name.${tile.key}`)}</span>
                <span className="eb-home-cat-cta">
                  {t("home.categories.view")} <span aria-hidden>→</span>
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </section>

      <section className="eb-home-section" aria-labelledby="eb-home-featured-title">
        <motion.div className="eb-home-head" {...reveal}>
          <div>
            <h2 id="eb-home-featured-title" className="eb-home-h2">
              {t("home.featured.title")}
            </h2>
            <p className="eb-home-muted">{t("home.featured.copy")}</p>
          </div>
          <MotionLink to="/products?featured=1" className="eb-home-link" {...linkPressProps}>
            {t("home.featured.viewAll")}
          </MotionLink>
        </motion.div>

        {showFeaturedSkeleton ? (
          <div className="eb-home-row" aria-busy="true" aria-live="polite" aria-label={t("home.featured.loading")}>
            {[0, 1, 2, 3].map((i) => (
              <div className="eb-home-row-item" key={i} aria-hidden>
                <div className="eb-home-media eb-home-shimmer" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <motion.div className="eb-home-row" variants={listStagger} initial={reduceMotion ? false : "hidden"} animate="visible">
            {products.map((product, index) => {
              const badge = deriveDisplayBadge(product)
              const thumb = product.images[0]?.url
              const name = product.name
              return (
                <motion.article className="eb-home-row-item" key={product.id} variants={listItem}>
                  <Link to={`/products/${product.id}`} className="eb-home-media eb-home-product-media">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={name}
                        className="eb-home-product-img"
                        loading={index < 2 ? "eager" : "lazy"}
                        decoding="async"
                      />
                    ) : (
                      <span className="eb-home-shimmer eb-home-product-img" aria-hidden>
                        <span className="eb-home-placeholder-label">{t("home.product.placeholder")}</span>
                      </span>
                    )}
                  </Link>
                  <div className="eb-home-product-meta">
                    <div className="eb-home-product-tags">
                      {badge ? <BadgePill badge={badge} /> : <span className="eb-home-tag">{t("home.featured.tag")}</span>}
                    </div>
                    <Link to={`/products/${product.id}`} className="eb-home-product-name">
                      {name}
                    </Link>
                    <span className="eb-home-product-price">{`$${Number(product.price).toFixed(2)}`}</span>
                    <motion.a
                      href={INSTAGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("home.product.orderAria", { name })}
                      className="eb-home-pill eb-home-pill--outline eb-home-pill--sm"
                      {...linkPressProps}
                    >
                      {t("home.product.orderInstagram")}
                    </motion.a>
                  </div>
                </motion.article>
              )
            })}
          </motion.div>
        ) : (
          <p className="eb-home-muted">{t("home.featured.empty")}</p>
        )}
      </section>

      <section className="eb-home-band" aria-label={t("home.quote")}>
        <p className="eb-home-band-quote">{t("home.quote")}</p>
        <span className="eb-home-band-rule" aria-hidden />
      </section>

      <section className="eb-home-section eb-home-men" aria-labelledby="eb-home-men-title">
        <motion.div className="eb-home-men-media" {...reveal}>
          <Link to={watchesTo} className="eb-home-men-link" aria-label={t("home.men.cta")}>
            <span className="eb-home-shimmer eb-home-men-img" aria-hidden>
              <span className="eb-home-placeholder-label">{t("home.hero.placeholder")}</span>
            </span>
          </Link>
        </motion.div>
        <motion.div className="eb-home-men-text" {...reveal}>
          <span className="eb-home-kicker">{t("home.men.kicker")}</span>
          <h2 id="eb-home-men-title" className="eb-home-h2">
            {t("home.men.title")}
            <br />
            <em>{t("home.men.titleAlt")}</em>
          </h2>
          <p className="eb-home-muted">{t("home.men.copy")}</p>
          <MotionLink to={watchesTo} className="eb-home-pill eb-home-pill--outline" {...linkPressProps}>
            {t("home.men.cta")}
          </MotionLink>
        </motion.div>
      </section>

      <section className="eb-home-section" aria-labelledby="eb-home-steps-title">
        <motion.h2 id="eb-home-steps-title" className="eb-home-h2 eb-home-section-title" {...reveal}>
          {t("home.steps.title")}
        </motion.h2>
        <motion.ol className="eb-home-steps" variants={listStagger} initial={reduceMotion ? false : "hidden"} whileInView="visible" viewport={scrollRevealViewport}>
          {STEP_KEYS.map((n) => (
            <motion.li key={n} className="eb-home-step" variants={listItem}>
              <span className="eb-home-step-num" aria-hidden>
                {String(n).padStart(2, "0")}
              </span>
              <h3 className="eb-home-step-title">{t(`home.steps.${n}.title`)}</h3>
              <p className="eb-home-muted">{t(`home.steps.${n}.copy`)}</p>
            </motion.li>
          ))}
        </motion.ol>
      </section>

      <section className="eb-home-section" aria-labelledby="eb-home-gallery-title">
        <motion.div className="eb-home-head eb-home-head--center" {...reveal}>
          <div>
            <h2 id="eb-home-gallery-title" className="eb-home-h2">
              {t("home.gallery.title")}
            </h2>
            <p className="eb-home-muted">{t("home.gallery.copy")}</p>
          </div>
        </motion.div>
        <motion.div className="eb-home-gallery" variants={listStagger} initial={reduceMotion ? false : "hidden"} whileInView="visible" viewport={scrollRevealViewport}>
          {instagramPosts.length > 0
            ? instagramPosts.slice(0, GALLERY_SLOTS).map((post) => (
                <motion.a
                  key={post.image}
                  variants={listItem}
                  href={post.href ?? INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="eb-home-gallery-item"
                >
                  <img src={post.image} alt={post.alt} className="eb-home-gallery-img" loading="lazy" decoding="async" />
                </motion.a>
              ))
            : Array.from({ length: GALLERY_SLOTS }, (_, i) => (
                <motion.span key={i} variants={listItem} className="eb-home-gallery-item eb-home-shimmer" aria-hidden />
              ))}
        </motion.div>
        <motion.div className="eb-home-follow" {...reveal}>
          <motion.a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t("home.gallery.follow")} @${INSTAGRAM_HANDLE}`}
            className="eb-home-pill"
            {...linkPressProps}
          >
            <FiInstagram aria-hidden />
            {t("home.gallery.follow")}
          </motion.a>
        </motion.div>
      </section>

      <div className="eb-home-sticky">
        <motion.a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("home.sticky.aria")}
          className="eb-home-pill eb-home-pill--sticky"
          {...linkPressProps}
        >
          <FiInstagram aria-hidden />
          {t("home.sticky.label")}
        </motion.a>
      </div>
    </div>
  )
}
