<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# peser — Bank Sampah Digital Kecamatan

## Commands
- `npm run dev` → http://localhost:3000
- `npm run lint` → eslint (flat config `eslint.config.mjs`).
- No `test` script and no `typecheck` script are defined. Typecheck manually with `npx tsc --noEmit` (tsc is a devDependency). **There is no test runner installed — don't assume `npm test`.**
- `npm run build` → `next build`.

## Stack
- Next.js 16.3 (custom build, see block above) + React 19, Tailwind v4.
- UI: **`@base-ui/react` (NOT Radix)** + shadcn (`style: base-nova`, see `components.json`), `lucide-react` icons.
- Path alias `@/*` → `src/*` (tsconfig). `cn()` helper in `src/lib/utils.ts`.
- Validation: **zod** (added for API route bodies).

## Prisma — read before touching the DB layer
- Prisma 7 + `@prisma/adapter-pg` (pg). Client is **generated, not in node_modules**: `src/generated/prisma`. Import `@/generated/prisma/client`.
- **Run `npx prisma generate` after every `schema.prisma` change.** Types silently go stale (e.g. `deletedAt`/`id` vanished from the generated model and tsc failed) until regenerated.
- `prisma.config.ts` reads **`DIRECT_URL`** for migrations/datasource, but `.env` leaves `DIRECT_URL` empty and only sets `DATABASE_URL` (Supabase pooler, `?pgbouncer=true`, port 6543). `prisma migrate`/`db` commands need a real `DIRECT_URL` (direct, non-pooled connection) to work.
- DB is Supabase Postgres; `DATABASE_URL` is the pooled runtime connection.

## Data rules (from schema header + PRD.md)
- Every model has `deletedAt DateTime?` = soft delete. **Never hard-delete; filter `deletedAt: null`** in queries. No `onDelete: Cascade` on transaction tables (BR-10).
- All IDs are `cuid()`; money/weight are `Decimal`.
- `PRD.md` is the source of truth for business rules (tagged `[WAJIB]`/`BR-xx`). When in doubt, answer from PRD + schema comments, not from guessing in code.

## API routes (`src/app/api/**/route.ts`)
- Route Handlers use Web `Request`/`Response`. `params` is a **`Promise`** (await it).
- Shared Prisma singleton: `src/lib/prisma.ts`. Reuse it; don't instantiate `PrismaClient` elsewhere.
- Shared zod schemas live next to the route (e.g. `src/app/api/kelurahan/schema.ts`); validate bodies with `schema.safeParse` and return `400` on failure.
