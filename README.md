# Cruzmi Admin

Internal back-office of the Cruzmi platform, reserved to Cruzmi super-admins.
Online at **https://admin.cruzmi.fr**.

Not to be confused with **Cruzmi Studio** (`cruzmi-studio`), the web app for travel professionals.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm dev
```

| Variable | Usage |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Cloud project (build time) |
| `SUPABASE_SERVICE_ROLE_KEY` | Full database access, server-side only (runtime) |
| `ADMIN_EMAILS` | Comma-separated whitelist of super-admin emails (runtime) |

See [CLAUDE.md](./CLAUDE.md) for the security model, conventions and roadmap.
