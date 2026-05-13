# Jewellery e-commerce (full stack)

Monorepo: **React (Vite) client**, **Express + TypeScript API**, **PostgreSQL**, and **Socket.IO** for order and notification hints.

## Live demo

- **Storefront:** _Add your Cloudflare Pages URL after deploy_
- **Source:** _Add your GitHub repository URL_

Checkout and payments are **simulated**. This is a portfolio demo, not a production shop.

## Stack

- **Client:** React 19, Vite, React Router, TanStack Query, Zustand, Tailwind CSS
- **API:** Express, TypeScript, Socket.IO, JWT auth, Kysely + `pg`
- **Database:** PostgreSQL (migrations and seed in `db/migrations/`)
- **Tooling:** pnpm workspace (`db/apps/client`, `db/apps/api`, `packages/types`)

## Try the demo

1. Open the live storefront and browse **Collections** or the home featured products.
2. Open a product, then **Register** or **Login** as a customer.
3. Add items to the cart and complete **Checkout** (simulated payment).
4. Open **Orders** and **Notifications** as the customer.
5. Log in as admin: `admin@example.com` / `Admin123!`
6. In **Admin**, open **Orders**, change an order status, and confirm the customer view updates (realtime or refresh).

On Render’s free API tier, the first request after idle time can take 30–60 seconds while the service wakes up.

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker Desktop (recommended) or local Postgres

## First-time setup

### 1) Install

```bash
pnpm install
```

### 2) Environment

Copy [.env.example](.env.example) to `db/apps/api/.env` and set at minimum:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Optional: `db/apps/client/.env.development` (see [.env.example](.env.example) for `VITE_*` defaults).

### 3) Database

**Docker (recommended)**

```bash
docker compose up -d
```

Use in `db/apps/api/.env`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5433/template_auth_catalog
```

**Local Postgres** — create DB `template_auth_catalog` and point `DATABASE_URL` at your role.

### 4) Migrate and seed

```bash
pnpm --filter @jewellery/api db:migrate
pnpm --filter @jewellery/api db:seed
```

### 5) Development

```bash
pnpm dev
```

- API + Socket.IO: `http://localhost:3001`
- Client: `http://localhost:5173`

## Default admin

- Email: `admin@example.com`
- Password: `Admin123!`

## Features

- Public **catalogue** (categories, products, featured filter, product images, urgency badges, stock).
- **Cart** and **checkout** (MVP: simulated payment choice + shipping text).
- **Orders** with status timeline and staff transitions (`order.write` or `admin`).
- **Notifications** persisted and pushed over **Socket.IO** (`order:created`, `order:status_updated`, `notification:new`).
- **Admin** UI for products and orders (staff permissions).

## Deployment (portfolio)

Recommended split stack:

| Layer | Provider |
|--------|-----------|
| Database | [Neon](https://neon.tech) |
| API + Socket.IO | [Render](https://render.com) Web Service ([`render.yaml`](render.yaml)) |
| Frontend | [Cloudflare Pages](https://pages.cloudflare.com) |

### Neon

1. Create a project and database.
2. Copy the connection string (add `?sslmode=require` if required).
3. Use it as production `DATABASE_URL` (never commit it).

### Render (API)

| Setting | Value |
|---------|--------|
| Root directory | Repository root |
| Build command | `pnpm install && pnpm --filter @jewellery/api build` |
| Start command | `pnpm --filter @jewellery/api start` |

Set `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` in the Render dashboard. The API listens on `API_PORT`, `PORT`, or `3001`.

After deploy, verify `GET https://<api-host>/health`.

### Migrate and seed (remote)

From your machine with the Neon URL in the environment:

```bash
export DATABASE_URL='postgres://...'
pnpm --filter @jewellery/api db:migrate
pnpm --filter @jewellery/api db:seed
```

Re-run **seed** before interviews or when demo data looks stale.

### Cloudflare Pages (client)

| Setting | Value |
|---------|--------|
| Build command | `pnpm install && pnpm --filter @jewellery/client build` |
| Build output directory | `db/apps/client/dist` |
| Node version | `20` |

Build environment variables (required):

- `VITE_API_URL=https://<your-render-api-host>`
- `VITE_SOCKET_URL=https://<your-render-api-host>`

Enable **Single-page application** fallback, or rely on [`db/apps/client/public/_redirects`](db/apps/client/public/_redirects) (`/* /index.html 200`).

Rebuild the client whenever the API URL changes.

### Portfolio maintenance

- Share the **client URL** on your CV and portfolio site; link this repository from the README.
- **Monthly or before interviews:** open the live site, hit `/health` on the API, run through login and checkout once.
- Reset demo data with `db:seed` against Neon, or recreate the database.
- Do not store real personal or payment data.

## API and realtime contract

See [packages/docs/backend-contract.md](packages/docs/backend-contract.md).

## QA

See [packages/docs/qa-checklist.md](packages/docs/qa-checklist.md).

## Troubleshooting

- **Docker not running** — start Docker Desktop before `docker compose up -d`.
- **`role "postgres" does not exist`** — use Docker Postgres or adjust `DATABASE_URL` to your local role.
- **JWT errors** — ensure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set in `db/apps/api/.env`.
- **CORS / API URL** — set `VITE_API_URL` and `VITE_SOCKET_URL` to the API origin if not using localhost:3001.

## Packages

| Package | Description |
|---------|-------------|
| `db/apps/client` | Vite + React storefront and admin UI |
| `db/apps/api` | Express API + Socket.IO |
| `packages/types` | Shared TypeScript types |
| `db` | SQL migrations + seed script |
