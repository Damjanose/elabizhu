import { motion } from "motion/react"
import { useParams } from "react-router-dom"
import { getJournalPostBySlug } from "../data/journalPosts"
import { fadeUp, scrollRevealViewport } from "../lib/motion"
import { MotionLink, linkPressProps } from "../components/motion/MotionLink"

export const JournalPostPage = () => {
  const { slug = "" } = useParams()
  const post = getJournalPostBySlug(slug)

  if (!post) {
    return (
      <motion.section className="py-12 md:py-20 text-center" variants={fadeUp} initial="hidden" animate="visible">
        <span className="aurelia-admin-kicker mb-3 d-inline-block">Journal</span>
        <h1 className="font-display-xl text-headline-lg font-normal mb-3">This story could not be found</h1>
        <p className="aurelia-muted mb-4">The article may have moved or the link is incorrect.</p>
        <MotionLink to="/journal" className="aurelia-btn aurelia-btn-primary text-decoration-none" {...linkPressProps}>
          Back to Journal
        </MotionLink>
      </motion.section>
    )
  }

  return (
    <motion.article className="py-12 md:py-16" variants={fadeUp} initial="hidden" animate="visible">
      <header className="max-w-3xl mx-auto text-center mb-10 md:mb-12">
        <span className="aurelia-admin-kicker mb-3 d-inline-block">{post.kicker}</span>
        <h1 className="font-display-xl text-headline-lg font-normal mb-4 mt-2">{post.title}</h1>
        <p className="aurelia-muted small mb-0">{post.readMinutes} min read</p>
      </header>

      <div className="max-w-4xl mx-auto mb-10 md:mb-12 overflow-hidden">
        <img src={post.imageUrl} alt="" className="w-100 object-fit-cover aurelia-journal-post-hero" loading="eager" />
      </div>

      <motion.div
        className="max-w-2xl mx-auto px-0"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={scrollRevealViewport}
      >
        {post.body.map((para, i) => (
          <p key={i} className="aurelia-muted mb-4" style={{ lineHeight: 1.75 }}>
            {para}
          </p>
        ))}
      </motion.div>

      <div className="text-center mt-12">
        <MotionLink to="/journal" className="aurelia-nav-link text-decoration-none" {...linkPressProps}>
          ← All journal stories
        </MotionLink>
      </div>
    </motion.article>
  )
}
