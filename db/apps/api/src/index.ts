import { createServer } from "node:http"
import fs from "node:fs"
import type { NextFunction, Request, Response } from "express"
import "dotenv/config"
import express from "express"
import cors from "cors"
import multer from "multer"
import * as authHandlers from "./handlers/auth.js"
import * as cartHandlers from "./handlers/cart.js"
import * as categoryHandlers from "./handlers/categories.js"
import * as adminUserHandlers from "./handlers/adminUsers.js"
import * as notificationHandlers from "./handlers/notifications.js"
import * as orderHandlers from "./handlers/orders.js"
import * as productHandlers from "./handlers/products.js"
import * as profileHandlers from "./handlers/profile.js"
import * as uploadHandlers from "./handlers/uploads.js"
import { upload, uploadsRoot } from "./handlers/uploads.js"
import { requireAuth, requirePermission } from "./middleware/auth.js"
import { attachSocket } from "./socketServer.js"

const app = express()
const port = Number(process.env.API_PORT ?? 3001)

app.use(cors())
app.use(express.json())

if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true })
}
app.use("/uploads", express.static(uploadsRoot, { fallthrough: true, maxAge: "7d" }))

app.get("/health", (_req, res) => res.json({ ok: true }))

app.post("/auth/register", authHandlers.register)
app.post("/auth/login", authHandlers.login)
app.post("/auth/refresh", authHandlers.refresh)
app.post("/auth/logout", requireAuth, authHandlers.logout)
app.get("/auth/me", requireAuth, authHandlers.me)

app.patch("/me/profile", requireAuth, profileHandlers.updateProfile)
app.get("/me/addresses", requireAuth, profileHandlers.listAddresses)
app.post("/me/addresses", requireAuth, profileHandlers.createAddress)
app.patch("/me/addresses/:id", requireAuth, profileHandlers.updateAddress)
app.delete("/me/addresses/:id", requireAuth, profileHandlers.deleteAddress)
app.post("/me/addresses/:id/default", requireAuth, profileHandlers.setDefaultAddress)

app.get("/categories", categoryHandlers.list)
app.get("/categories/:id", categoryHandlers.getById)
app.get("/categories/:id/products", productHandlers.listByCategory)
app.post("/categories", requireAuth, requirePermission("category.write"), categoryHandlers.create)
app.patch("/categories/:id", requireAuth, requirePermission("category.write"), categoryHandlers.update)
app.delete("/categories/:id", requireAuth, requirePermission("category.write"), categoryHandlers.remove)

app.get("/products", productHandlers.list)
app.get("/products/:id", productHandlers.getById)
app.get("/products/:id/recommendations", productHandlers.recommendations)
app.post("/products", requireAuth, requirePermission("product.write"), productHandlers.create)
app.patch("/products/:id", requireAuth, requirePermission("product.write"), productHandlers.update)
app.delete("/products/:id", requireAuth, requirePermission("product.write"), productHandlers.remove)

app.get("/cart", requireAuth, cartHandlers.get)
app.post("/cart/items", requireAuth, cartHandlers.addItem)
app.patch("/cart/items/:productId", requireAuth, cartHandlers.patchItem)
app.delete("/cart/items/:productId", requireAuth, cartHandlers.removeItem)

app.get("/orders", requireAuth, orderHandlers.list)
app.post("/orders/checkout", requireAuth, orderHandlers.checkout)
app.get("/orders/:id", requireAuth, orderHandlers.getById)
app.patch("/orders/:id/status", requireAuth, requirePermission("order.write"), orderHandlers.updateStatus)

app.get("/admin/users", requireAuth, requirePermission("admin"), adminUserHandlers.list)
app.patch("/admin/users/:id/active", requireAuth, requirePermission("admin"), adminUserHandlers.setActive)
app.patch("/admin/users/:id/permissions", requireAuth, requirePermission("admin"), adminUserHandlers.setPermissions)

app.get("/admin/products", requireAuth, requirePermission("product.write"), productHandlers.adminList)

app.post(
  "/admin/uploads",
  requireAuth,
  requirePermission("product.write"),
  (req: Request, res: Response, next: NextFunction) => {
    upload.single("file")(req, res, (err: unknown) => {
      if (!err) {
        next()
        return
      }
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(413).json({ message: "File exceeds the maximum allowed size" })
          return
        }
        res.status(400).json({ message: err.message })
        return
      }
      if (err instanceof Error && err.message === "UNSUPPORTED_MEDIA_TYPE") {
        res.status(415).json({ message: "Unsupported media type" })
        return
      }
      console.error(err)
      res.status(500).json({ message: "Upload failed" })
    })
  },
  uploadHandlers.create,
)

app.get("/notifications", requireAuth, notificationHandlers.list)
app.patch("/notifications/:id/read", requireAuth, notificationHandlers.markRead)
app.post("/notifications/read-all", requireAuth, notificationHandlers.markAllRead)

const httpServer = createServer(app)
attachSocket(httpServer)

httpServer.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
