import path from "node:path"
import fs from "node:fs"
import { randomUUID } from "node:crypto"
import type { Request, Response } from "express"
import multer from "multer"

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
])
const ALLOWED_VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
])

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_VIDEO_BYTES = 100 * 1024 * 1024

export const uploadsRoot = path.resolve(process.cwd(), "uploads")

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

const monthFolder = () => {
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0")
  return `${yyyy}-${mm}`
}

const extFromMime = (mime: string, fallback: string) => {
  switch (mime) {
    case "image/jpeg":
      return ".jpg"
    case "image/png":
      return ".png"
    case "image/webp":
      return ".webp"
    case "image/avif":
      return ".avif"
    case "image/gif":
      return ".gif"
    case "video/mp4":
      return ".mp4"
    case "video/webm":
      return ".webm"
    case "video/quicktime":
      return ".mov"
    default:
      return fallback || ""
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(uploadsRoot, monthFolder())
    ensureDir(dir)
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const ext = extFromMime(file.mimetype, path.extname(file.originalname).toLowerCase())
    cb(null, `${randomUUID()}${ext}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME.has(file.mimetype) || ALLOWED_VIDEO_MIME.has(file.mimetype)) {
      cb(null, true)
      return
    }
    cb(new Error("UNSUPPORTED_MEDIA_TYPE"))
  },
})

const kindFor = (mime: string): "image" | "video" | null => {
  if (ALLOWED_IMAGE_MIME.has(mime)) return "image"
  if (ALLOWED_VIDEO_MIME.has(mime)) return "video"
  return null
}

const cleanupFile = (filePath: string) => {
  fs.promises.unlink(filePath).catch(() => undefined)
}

export const create = (req: Request, res: Response) => {
  const file = (req as Request & { file?: Express.Multer.File }).file
  if (!file) {
    return res.status(400).json({ message: "No file uploaded under field 'file'" })
  }

  const kind = kindFor(file.mimetype)
  if (!kind) {
    cleanupFile(file.path)
    return res.status(415).json({ message: "Unsupported media type" })
  }

  if (kind === "image" && file.size > MAX_IMAGE_BYTES) {
    cleanupFile(file.path)
    return res.status(413).json({ message: "Image exceeds 8MB limit" })
  }

  const relative = path.relative(uploadsRoot, file.path).split(path.sep).join("/")
  const url = `/uploads/${relative}`
  return res.status(201).json({ url, kind })
}
