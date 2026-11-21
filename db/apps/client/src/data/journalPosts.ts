import type { Lang } from "../i18n/types"

export type JournalText = {
  kicker: string
  title: string
  excerpt: string
  /** Plain paragraphs for article view */
  body: string[]
}

export type JournalPost = {
  slug: string
  imageUrl: string
  readMinutes: number
  sq: JournalText
  en: JournalText
}

/** A post with its text already resolved to one language. */
export type LocalizedJournalPost = Omit<JournalPost, "sq" | "en"> & JournalText

export const journalPosts: JournalPost[] = [
  {
    slug: "celestial-craftsmanship",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuANIPK2sA_DRxWB_X0cI9oci-WSe6NXAJqBeV5uM-oNM7loqG2k7g7pBlapLwp_wZ0OGa0R5npIpEr_XD2x6SU_bAp-g1C4KGl3UWFPuM8rO2rSEXdTBlWO_NA8AIjlf12oCTHnMehix8fRwglYRDYfBVhKfagn1YN0QkTILB3_eqtipyes0e1P19vkR6oMivth7PNQftjceEEOaZOXTFns8iInHoDjkLH2_WFlWb1Z8DfLkCbBl_DV6jrISOgov80h7lOFKCn4Gw",
    readMinutes: 6,
    sq: {
      kicker: "Shënime nga Atelier-i",
      title: "Zanati qiellor: si i prehim dhe i vendosim gurët",
      excerpt:
        "Brenda atelier-it në Londër, ku vendosësit mjeshtër balancojnë dritën, gurin dhe arin derisa çdo faqe të këndojë.",
      body: [
        "Në ElaBizhu, çdo copë e trajtojmë si një botë të vogël—balancë peshe dhe ajri, errësirë dhe zjarr. Vendosësit tanë punojnë nën llamba të kalibruara sipas dritës së ditës, që çdo diamant t’i shfaqet syrit me të njëjtin shkëlqim të qetë që do të shihni në sallonin tonë në Mayfair.",
        "Linja Celestial nisi si skica në pergamenë: konstelacione të reduktuara në harqe ari. Ajo që mbani sot është distilimi i dymbëdhjetë muajve rafinimi—asgjë tjetër veçse ajo që duhet të mbetet.",
        "Ju ftojmë të rezervoni një shikim privat kur të jeni gati të shihni vetë gurët duke lëvizur.",
      ],
    },
    en: {
      kicker: "Atelier Notes",
      title: "Celestial Craftsmanship: How We Cut and Set",
      excerpt:
        "Inside the London atelier, where master setters balance light, stone, and gold until every facet sings.",
      body: [
        "At ElaBizhu, we treat each piece as a small world—balance of weight and air, darkness and fire. Our setters work under daylight-calibrated lamps so every diamond meets the eye with the same quiet brilliance you’ll see in our Mayfair salon.",
        "The Celestial line began as sketches on vellum: constellations reduced to arcs of gold. What you wear today is the distillation of twelve months of refinement—nothing left but what must remain.",
        "We invite you to book a private viewing when you’re ready to see the stones move for yourself.",
      ],
    },
  },
  {
    slug: "ethically-sourced-gold",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCUCHmTYIJOJ5wHsDpcxGrnB8IoZYhdRfeeEOL6loLp9RhZ-X75eABlbfi1VokYKsf0pPjpN6U5KDla5h4Tuv953JkrshABTw1QXla7fw1g08a762tuX0dmXjcQN8uUHRWoknYYm6n_UlXV-o1ZPZICFGzKPAzBBwf234FUqxli3IzAkMN-YddIlcPGd6uC3NVVmE10s76I_B28_vqguclGYE9UZcQQpdrFLWT2DzBvDQjV7UsFQAijDqK2YtGjcofRXHK482Jf1Q",
    readMinutes: 4,
    sq: {
      kicker: "Luks i përgjegjshëm",
      title: "Pse historia e arit tonë fillon nën tokë",
      excerpt:
        "Gjurmueshmëria nuk është një fjalë e modës—është e vetmja mënyrë që ne flemë qetë natën. Ja si e burimojmë dhe e rafinojmë.",
      body: [
        "Metalet e riciklueshme dhe ato të reja të nxjerra kanë vendin e tyre në punishten tonë—ajo që ka rëndësi është zinxhiri i pronësisë. Çdo grumbull vjen me dokumentacion që mund t’ju tregojmë, jo ta fshehim.",
        "Kur na porosisni punë me porosi, do t’ju udhëheqim përmes opsioneve për aliazhet dhe përfundimet, gjithmonë me klimën dhe komunitetin në mendje.",
      ],
    },
    en: {
      kicker: "Responsible Luxury",
      title: "Why Our Gold Story Starts in the Ground",
      excerpt: "Traceability isn’t a buzzword—it’s the only way we sleep at night. Here’s how we source and refine.",
      body: [
        "Recycled and newly mined metals both have a place in our workshop—what matters is the chain of custody. Every batch arrives with documentation we can show you, not bury.",
        "When you commission bespoke work, we’ll walk you through options for alloys and finishes, always with climate and community in mind.",
      ],
    },
  },
  {
    slug: "signature-pearls",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDls09bXH9zpm_nvTZOOAJ0vui7QX-RrLm7V3zsv0cypbxpoP-mpePXuvn-4iRAqglr9MgQh9-UFYy_lHu4DORu1a-B0SWCOuKtePiA-3KnySf8WlvR5Dn4jK0xK0MefnMvXtaPhDSMFTIsZpOjWUwA7c1f9nzwkqQ4yyGzg13QcHr5UJdjZg3Zh9TnbDJ87v0Qa_ndGzHIvjIA-XqVLtvo1F6PUkXfPQxPEq3LZ2gK6EarnB_g9CXet91YiRy8Z-fpQ7ROordXoQ",
    readMinutes: 5,
    sq: {
      kicker: "Stili",
      title: "Seria Signature: perla për mbrëmjen",
      excerpt: "Shtresimi i vargjeve shkëlqyese me ar minimal—çiftet e preferuara të redaktorëve tanë këtë sezon.",
      body: [
        "Perlat kapin dritën e qirinjve si asgjë tjetër. Ne preferojmë sipërfaqe paksa të parregullta—ato pëshpërisin në vend që të bërtasin.",
        "Provoni një varg me një unazë të thjeshtë, ose mbani dy vargje për darka festive. Stilistët tanë janë vetëm një mesazh larg.",
      ],
    },
    en: {
      kicker: "Style",
      title: "The Signature Series: Pearls for Evening",
      excerpt: "Layering luminous strands with minimal gold—our editors’ favourite pairings this season.",
      body: [
        "Pearls catch candlelight like nothing else. We favour slightly irregular surfaces—they whisper instead of shout.",
        "Try one strand with a simple signet, or stack two lengths for galas. Our stylists are a note away.",
      ],
    },
  },
]

/** Resolves a post's text to one language. */
export const localizeJournalPost = (post: JournalPost, lang: Lang): LocalizedJournalPost => {
  const { sq, en, ...shared } = post
  return { ...shared, ...(lang === "en" ? en : sq) }
}

export const getJournalPosts = (lang: Lang): LocalizedJournalPost[] =>
  journalPosts.map((p) => localizeJournalPost(p, lang))

export const getJournalPostBySlug = (slug: string, lang: Lang): LocalizedJournalPost | undefined => {
  const post = journalPosts.find((p) => p.slug === slug)
  return post ? localizeJournalPost(post, lang) : undefined
}
