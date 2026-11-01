# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**Cruzmi Admin** is the internal back-office of Cruzmi, reserved to a handful of super-admins
(whitelist). It reads and administers ALL the platform data (accounts, trips, medias, expenses,
suggestions, activities, storage files) without going through the Supabase dashboard.

It is NOT Cruzmi Studio (`../cruzmi-backoffice`, repo `cruzmi-studio`), the web app for travel
professionals. Studio rules such as "always filter by `created_by`" do NOT apply here: this app sees
everything on purpose, so the security rules below are what protects the data.

## Commands (pnpm)

- `pnpm dev` — dev server (Turbopack)
- `pnpm lint` / `pnpm type-check` — run both before committing
- `pnpm build:production` — production build (used by the Dockerfile). On Windows the final
  `standalone` copy step fails with EPERM (symlinks); compilation success is what matters locally.

## Security model (non-negotiable)

1. **Authentication**: Supabase email + password, existing Cruzmi accounts.
2. **Whitelist**: `ADMIN_EMAILS` env var (comma-separated), read at runtime in `lib/auth/admins.ts`.
3. **Two locks**:
   - `middleware.ts` sends anonymous visitors to `/login`.
   - `requireAdmin()` (`lib/auth/require-admin.ts`) validates the user with `getUser()` and checks
     the whitelist. It runs in the `(admin)` layout AND inside `getAdminDb()`.
4. **service_role key**: only reachable through `getAdminDb()` (`lib/supabase/admin.ts`), which
   calls `requireAdmin()` first. Never export or create another service client. Everything is
   `server-only`: reads in Server Components, writes in Server Actions that call `getAdminDb()`.
   The browser never talks to the database.
5. **Destructive actions** (later lots): mandatory preview, typed confirmation, and a log.
   Decision (2026-11): do NOT modify the shared schema for now — the deletion log goes to server logs.
6. `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_EMAILS` are runtime-only env vars: never mark them as
   build variables in Coolify, never prefix them with `NEXT_PUBLIC_`.

## Stack & conventions

- Next.js 15 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui (copied from Studio),
  `@tabler/icons-react` for all icons, Darker Grotesque font (Cruzmi brand).
- UI language: French. Code, comments and commits: English.
- Tailwind classes only (no inline styles / raw colors). Support dark mode.
- kebab-case files, PascalCase components, camelCase functions.
- Server Components by default; `'use client'` only for interactivity.
- Pages under `app/(admin)/` are protected by its layout.

## Database

- Supabase Cloud project `vefvjgyjapblklierzia`, shared with Studio and the mobile app.
- Schema is owned by `../Dev/cruzmi-supabase-conf` — never change it from here.
- Most child tables use `ON DELETE CASCADE` on `trip_id`, but cascades never delete Storage files:
  storage buckets (`medias`, `avatars`, `albums`, ...) are the main source of orphans.
- Array/id references (`image_ids`, `cover_image_id`, `picture_id`, `poi_ids`, ...) have no FK and
  can dangle.

## Deployment

- Coolify (Dockerfile build), single online environment: `main` → `admin.cruzmi.fr`.
- `develop` is the working branch; release = PR `develop` → `main` with a merge commit.

## Roadmap

- Lot A — foundation: auth + whitelist + layout + deploy (done)
- Lot B — read-only dashboards: overview, accounts, trips, trip detail (tables, no charts yet)
- Lot C — orphans: C1 read-only inventory, then C2 cleanup with preview/confirm/log
- Lot D — account/trip admin actions (to be defined)
