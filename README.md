# Jewellery E-Commerce Platform

A full-stack e-commerce application for a luxury jewellery shop, built as a portfolio project to showcase modern web development practices.

## About the Project

This is a complete e-commerce platform featuring a **public storefront** where customers can browse jewellery collections, manage their cart, and complete purchases. The platform includes a **real-time admin dashboard** for managing products and orders with live notifications. Customers can track order status changes in real-time, and admins can update orders while seeing customer notifications update instantly via WebSocket connections.

**Note:** Checkout and payments are simulated. This is a portfolio demo, not a production shop.

## Live Demo

- https://jewellery-ecommerce-app-frontend.vercel.app/
- **Storefront:** _Add your Cloudflare Pages URL after deploy_
- **Source:** _Add your GitHub repository URL_

## Technology Stack

### Frontend
- **React 19** – UI library with latest features
- **Vite** – Fast build tool and dev server
- **React Router v7** – Client-side routing
- **TanStack React Query** – Server state management
- **Zustand** – Lightweight client state management
- **Tailwind CSS** – Utility-first styling
- **Socket.IO Client** – Real-time updates
- **Formik + Yup** – Form validation
- **Recharts** – Data visualization for dashboards
- **GSAP & Motion** – Animations

### Backend
- **Express.js** – Lightweight Node.js web framework
- **TypeScript** – Type-safe development
- **Socket.IO** – Real-time bidirectional communication
- **JWT Authentication** – Secure user sessions
- **Kysely** – Type-safe SQL query builder
- **PostgreSQL Driver (`pg`)** – Database connectivity
- **bcryptjs** – Password hashing
- **Multer** – File upload handling
- **Zod** – Runtime schema validation

### Database
- **PostgreSQL** – Relational database with migrations and seed data

### DevOps & Tooling
- **pnpm workspace** – Monorepo package management
  - `db/apps/client` – React frontend
  - `db/apps/api` – Express backend
  - `packages/types` – Shared TypeScript types
- **Docker** – Containerization for local development
- **TypeScript** – End-to-end type safety

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
| Frontend | [Vercel](https://vercel.com) |

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

### Vercel (client)

| Setting | Value |
|---------|--------|
| Framework | Vite |
| Build command | `pnpm install && pnpm --filter @jewellery/client build` |
| Output directory | `db/apps/client/dist` |
| Node version | `20` |

Environment variables (required):

- `VITE_API_URL=https://<your-render-api-host>`
- `VITE_SOCKET_URL=https://<your-render-api-host>`

Vercel automatically handles SPA fallback routing for Vite projects.

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
