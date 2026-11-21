export const INSTAGRAM_HANDLE = "elabizhu"
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`

export const TIKTOK_URL = "https://www.tiktok.com/@elabizhu"

export type InstagramPost = {
  /** Image path, e.g. "/instagram/post-1.jpg" (place files in public/instagram/) */
  image: string
  alt: string
  /** Optional link to the specific post; falls back to the profile */
  href?: string
}

/**
 * Photos shown in the home page "Follow us on Instagram" grid.
 * Save images from the profile into public/instagram/ and list them here.
 */
export const instagramPosts: InstagramPost[] = []
