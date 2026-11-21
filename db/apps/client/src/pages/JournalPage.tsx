import { motion } from "motion/react"
import { Link } from "react-router-dom"
import { MotionLink, linkPressProps } from "../components/motion/MotionLink"
import { getJournalPosts } from "../data/journalPosts"
import { useI18n } from "../i18n"
import { fadeUp, listItem, listStagger, scrollRevealViewport } from "../lib/motion"

export const JournalPage = () => {
  const { t, lang } = useI18n()
  const [featured, ...rest] = getJournalPosts(lang)

  return (
    <motion.section className="py-12 md:py-20" variants={fadeUp} initial="hidden" animate="visible">
      <header className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
        <span className="aurelia-admin-kicker mb-3 d-inline-block">{t("catalog.journal.kicker")}</span>
        <h1 className="font-display-xl text-headline-lg font-normal mb-4 mt-2">{t("catalog.journal.title")}</h1>
        <p className="aurelia-muted mb-0">
          {t("catalog.journal.copy")}
        </p>
      </header>

      {featured && (
        <MotionLink
          to={`/journal/${featured.slug}`}
          className="relative group block overflow-hidden bg-surface-dim mb-10 md:mb-14 rounded-0"
          style={{ color: "#fff8f3", textDecoration: "none", minHeight: "min(52vh, 420px)" }}
          {...linkPressProps}
        >
          <img
            src={featured.imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
          />
          <div
            aria-hidden
            className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-95"
            style={{
              background:
                "linear-gradient(180deg, rgba(20,16,10,0.35) 0%, rgba(20,16,10,0) 40%, rgba(20,16,10,0.55) 100%)",
            }}
          />
          <div className="relative z-10 flex flex-col justify-end min-h-[min(52vh,420px)] px-6 py-10 md:px-12 md:py-14">
            <span className="text-[11px] uppercase tracking-[0.32em] mb-3" style={{ color: "rgba(255,248,243,0.72)" }}>
              {t("catalog.journal.featuredMeta", { min: featured.readMinutes })}
            </span>
            <h2
              className="m-0 font-normal text-[clamp(1.75rem,4vw,2.75rem)] leading-tight tracking-wide max-w-2xl"
              style={{ fontFamily: '"Noto Serif", serif', color: "#fff8f3" }}
            >
              {featured.title}
            </h2>
            <p className="mt-4 mb-0 max-w-xl small" style={{ color: "rgba(255,248,243,0.88)" }}>
              {featured.excerpt}
            </p>
            <span aria-hidden className="mt-6 block h-px w-10 group-hover:w-20 transition-all duration-700" style={{ background: "rgba(255,248,243,0.55)" }} />
          </div>
        </MotionLink>
      )}

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-gutter"
        variants={listStagger}
        initial="hidden"
        whileInView="visible"
        viewport={scrollRevealViewport}
      >
        {rest.map((post) => (
          <motion.article key={post.slug} variants={listItem}>
            <Link
              to={`/journal/${post.slug}`}
              className="text-decoration-none d-block h-100 aurelia-journal-card group"
              style={{ color: "inherit" }}
            >
              <div className="ratio ratio-4x3 overflow-hidden mb-4 bg-surface-dim">
                <img
                  src={post.imageUrl}
                  alt=""
                  loading="lazy"
                  className="object-fit-cover w-100 h-100 transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <span className="aurelia-admin-kicker d-block mb-2" style={{ fontSize: "0.65rem" }}>
                {post.kicker} · {t("catalog.journal.minOnly", { min: post.readMinutes })}
              </span>
              <h3 className="aurelia-admin-title h5 mb-2">{post.title}</h3>
              <p className="aurelia-muted small mb-0">{post.excerpt}</p>
            </Link>
          </motion.article>
        ))}
      </motion.div>
    </motion.section>
  )
}
