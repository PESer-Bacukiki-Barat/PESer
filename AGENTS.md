<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# PESer

Indonesian-language waste-inventory PWA ("Eco-System Intelligence"): Next.js 16.3.0 App Router, React 19.2.8, TypeScript strict, Tailwind v4, shadcn (`base-nova` style).

## Commands

- `npm run dev` — dev server. **npm only** (no pnpm/yarn/bun lockfiles present).
- `npm run lint` — ESLint (flat config).
- `npm run build` — production build; doubles as type-check.
- `npx tsc --noEmit` — standalone typecheck (there is **no** test suite, test script, or CI — `build` + `lint` + `tsc` are the only verification).

## Conventions & gotchas

- **Tailwind v4, CSS-first config**: there is no `tailwind.config.*`. Theme tokens live in `src/app/globals.css` via `@theme` / CSS variables. Extend the theme there, not in a config file.
- **UI primitives are Base UI** (`@base-ui/react`), not Radix. shadcn components go in `src/components/ui`; add new ones with `npx shadcn add`, `cn()` comes from `@/lib/utils`. Icons: `lucide-react`.
- **Path alias**: `@/*` → `src/*`.
- **`DESIGN.md` is the design-system source of truth** (colors, typography, spacing in frontmatter). Its tokens are wired into `src/app/globals.css` (`@theme`: `surface`, `on-surface-variant`, `primary-container`, `outline-variant`, `headline-*`, `label-*`, …) — extend there, don't invent new color names. Brand palette: primary emerald `#006c49`, Hanken Grotesk + JetBrains Mono (loaded via `next/font` in `src/app/layout.tsx`), rounded cards, mobile-first. UI copy is Indonesian ("Input Sampah", "Waste is Value").
- **Admin panel**: shell lives in `src/app/admin/layout.tsx` (mobile top bar, desktop sidebar/topnav, bottom nav); nav items + active-route highlighting in the client component `src/components/admin/admin-nav.tsx`. Screens are Server Components by default — add `"use client"` only where state/interactivity is needed.
- `next/font` is set up in `src/app/layout.tsx`; a map via `leaflet` is planned (dep installed, not yet used).
