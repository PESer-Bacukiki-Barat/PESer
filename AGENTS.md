<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# peser — Bank Sampah Digital Kecamatan

## Commands
- `npm run dev` → http://localhost:3000 (**npm only** — no pnpm/yarn/bun lockfiles).
- `npm run build` → `next build` (doubles as type-check).
- `npm run lint` → eslint (flat config `eslint.config.mjs`).
- `npm test` → jest. Config in `jest.config.mjs`: runs `**/__tests__/**/*.test.ts` under `src/`, maps `@/`→`src/`, transforms via `@swc/jest`. Run one file with `npx jest <path>`. **There are currently no test files** (the `tests/` dir is empty) — don't assume coverage exists.
- `npm run db:seed` → `tsx prisma/seed.ts` (creates/upserts admin user; `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, default `admin@peser.local` / `admin123`).
- `npx tsc --noEmit` → standalone typecheck (no dedicated script).

## Stack
- Next.js 16.3 (custom build, see block above) + React 19, Tailwind v4.
- UI: **`@base-ui/react` (NOT Radix)** + shadcn (`style: base-nova`, see `components.json`), `lucide-react` icons.
- Validation: **zod** for API route bodies.
- Auth: **next-auth v5 (beta)**, Credentials + JWT strategy (`src/auth.ts`). `src/middleware.ts` protects all routes **except** `/`, `/login`, and `/api/*` — API routes are public by default and guard themselves via `requireAuth`.

## Prisma — read before touching the DB layer
- Prisma 7 + `@prisma/adapter-pg` (pg). Client is **generated, not in node_modules**: `src/generated/prisma`. Import `@/generated/prisma/client`.
- **Run `npx prisma generate` after every `schema.prisma` change.** Types silently go stale (e.g. `deletedAt`/`id` vanished from the generated model) until regenerated.
- `prisma.config.ts` reads **`DIRECT_URL`** for migrations/datasource, but `.env` leaves `DIRECT_URL` empty and only sets `DATABASE_URL` (Supabase pooler, `?pgbouncer=true`, port 6543). `prisma migrate`/`db` commands need a real `DIRECT_URL` (direct, non-pooled connection) to work.
- Shared singleton: `src/lib/prisma.ts` (PrismaPg adapter + `DATABASE_URL`). Reuse it; don't instantiate `PrismaClient` elsewhere.

## Data rules (from schema header + PRD.md)
- Every model has `deletedAt DateTime?` = soft delete. **Never hard-delete; filter `deletedAt: null`** in queries. No `onDelete: Cascade` on transaction tables (BR-10).
- All IDs are `cuid()`; money/weight are `Decimal`.
- `PRD.md` is the source of truth for business rules (tagged `[WAJIB]`/`BR-xx`). When in doubt, answer from PRD + schema comments, not from guessing in code.

## API routes (`src/app/api/**/route.ts`)
- Route Handlers use Web `Request`/`Response`. `params` is a **`Promise`** (await it).
- Guard with `requireAuth()` from `src/lib/auth.ts` (returns `{ok:false, response}` → early-return `auth.response`); `getServerUser()` for Server Components.
- Shared zod schemas live next to the route (e.g. `src/app/api/kelurahan/schema.ts`); validate bodies with `schema.safeParse` and return `400` on failure.

## Conventions & gotchas
- **Tailwind v4, CSS-first config**: no `tailwind.config.*`. Theme tokens live in `src/app/globals.css` via `@theme` / CSS variables. Extend there, not in a config file.
- **`DESIGN.md` is the design-system source of truth** (colors, typography, spacing in frontmatter), wired into `src/app/globals.css`. Brand palette: emerald `#006c49`; Hanken Grotesk + JetBrains Mono via `next/font` in `src/app/layout.tsx`; rounded cards, mobile-first. **UI copy is Indonesian.**
- **Admin panel**: shell in `src/app/admin/layout.tsx` (fixed topbar + desktop-only sidebar, `md:ml-64` offset, no mobile bottom nav). Nav in `src/components/admin/admin-nav.tsx`. Screens are Server Components by default — add `"use client"` only where interactivity is needed.
- **CRUD tables**: generic `<DataTable>` in `src/components/ui/data-table.tsx`; domain wrappers `src/components/admin/*-table.tsx` take plain serializable data from the Server page. Next.js 16 forbids passing functions (render/action callbacks) from a Server Component into a Client Component.
