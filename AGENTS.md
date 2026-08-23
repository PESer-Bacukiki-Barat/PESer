<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# peser — Bank Sampah Digital Kecamatan

## Commands
- `npm run dev` → http://localhost:3000 (npm only; no pnpm/yarn/bun lockfiles).
- `npm run build` → `next build` (doubles as type-check).
- `npm run lint` → eslint (flat config `eslint.config.mjs`).
- `npm test` → jest; tests live in `src/**/__tests__/**/*.test.ts` (API route tests in `src/app/api/__tests__/`). Run one with `npx jest <path|name>`.
- `npm run db:seed` → `tsx prisma/seed.ts` (upserts admin user; `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, default `admin@peser.local` / `admin123`).
- `npx tsc --noEmit` → standalone typecheck (no dedicated script).
- `npx prisma generate` → **required** after any `schema.prisma` change; client types otherwise go silently stale.

## Stack
- Next.js 16.3 (custom build, see block above) + React 19, Tailwind v4 (CSS-first, no config file).
- UI: `@base-ui/react` (NOT Radix) + shadcn `base-nova` (`components.json`), `lucide-react` icons. Auth: next-auth v5 beta, Credentials + JWT (`src/auth.ts`); route guard `requireAuth` in `src/lib/auth.ts`. Validation: zod.

## Prisma
- Prisma 7 + `@prisma/adapter-pg`. Client is generated (gitignored) at `src/generated/prisma`; import `@/generated/prisma/client`. Reuse the singleton in `src/lib/prisma.ts` — don't instantiate `PrismaClient` elsewhere.
- `prisma.config.ts` datasource `url: process.env.DATABASE_URL`. `.env` defines `DATABASE_URL` (Supabase transaction pooler, port 6543, `pgbouncer=true` — app runtime) and `DIRECT_URL` (session pooler, port 5432 — direct). `prisma migrate` / `db` need a direct (non-pooled) connection, so point them at `DIRECT_URL`.

## Data rules (schema header + PRD.md)
- Every model has `deletedAt DateTime?` = soft delete. Never hard-delete; filter `deletedAt: null`. No `onDelete: Cascade` on transaction tables (BR-10).
- IDs are `cuid()`; money/weight are `Decimal`.
- `PRD.md` is the source of truth for business rules (`[WAJIB]` / `BR-xx`). Trust PRD + schema comments over guessed code.

## API routes (`src/app/api/**/route.ts`)
- Web `Request` / `Response`; `params` is a `Promise` (await it).
- **Never return `Response.json` directly.** PRD §2.5 mandates the envelope
  `{ success, data }` / `{ success, error: { code, message, field? } }` and the
  UI depends on it. Use `ok()` / `created()` / `noContent()` / `fail()` /
  `failValidation()` from `src/lib/response.ts`; HTTP status is derived from the
  error code, never written by hand. Guarded by `src/lib/__tests__/response.test.ts`.
- Guard with `requireAuth()` from `src/lib/auth.ts` (returns `{ ok: false, response }` → early-return `auth.response`); pass `"ADMIN"` / `"PETUGAS"` when the PRD access matrix (§2.4) restricts the action. `getServerUser()` for Server Components. The role each handler demands is asserted in `src/app/api/__tests__/authorization.test.ts` — mocking `requireAuth` alone cannot catch a missing role argument.
- zod schemas live next to the route; validate with `schema.safeParse`, then
  `failValidation(parsed.error.issues)` → **422** (PRD §2.5, not 400).
- Client side, `src/lib/api.ts` unwraps the envelope in an axios interceptor, so
  components still receive the payload directly.

## Conventions
- Theme tokens + DESIGN.md palette live in `src/app/globals.css` (`@theme` / CSS vars); brand emerald `#006c49`; Hanken Grotesk + JetBrains Mono via `next/font` in `src/app/layout.tsx`. UI copy is Indonesian.
- Admin shell: `src/app/admin/layout.tsx` (topbar + desktop sidebar, `md:ml-64` offset); CRUD screens are Server Components by default — add `"use client"` only where interactivity is needed. Tables use the generic `<DataTable>` (`src/components/ui/data-table.tsx`); domain wrappers `src/components/admin/*-table.tsx` receive plain serializable data. Next.js 16 forbids passing functions from a Server Component into a Client Component.
- Reuse UI building blocks: row actions via `deleteAction` / `editAction` / `viewAction` (`@/components/admin/row-actions`) + `RowActionButton`; delete confirmation via `ConfirmDialog` (`@/components/ui/confirm-dialog`), never `window.confirm`; dialogs use `Modal` (`@/components/ui/modal`).
