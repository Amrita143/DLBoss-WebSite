# DLBOSS Admin-Driven Result Platform (Updated Guide)

This file explains the project in plain language so non-developers can understand:
- what this app does,
- where important code lives,
- how admin/superadmin access works,
- which commands to run.

## 1) What this project is

This is a **Next.js + Supabase** web app that shows market outcomes on the public site.

Key rule:
- Public users only see data entered by backend admins.
- No scraped market results are rendered on frontend.

The app has 2 sides:
- Public website (`/`) for visitors.
- Admin panel (`/admin`) to manage markets, outcomes, charts, settings.

## 2) Roles and access

### Superadmin
- Login ID: managed in DB (`admin_users.login_id`)
- Can do everything admin can do.
- Can also create/delete admins from `/admin/admins`.

### Admin
- Can manage markets, outcomes, charts, pages, settings.
- Cannot manage admin accounts.

### Login model
- Login is done with **Admin ID + password**.
- "Forgot Password" message in login page:
  - `Please contact the developer for resetting your password.`

## 3) High-level architecture

- Frontend: Next.js App Router (`/app`)
- Backend DB/Auth: Supabase Postgres + Supabase Auth
- Server-side access:
  - SSR client for session-aware checks
  - service-role client for protected admin operations

Main flow:
1. Superadmin/admin logs in at `/admin/login`.
2. Session is created via Supabase auth.
3. App verifies that the auth user exists in `admin_users`.
4. Admin updates markets/results/charts.
5. Public home and chart routes fetch from DB and show updated data.

## 4) Database tables (important)

- `markets`: market master records (name, slug, timings, status)
- `market_results`: daily result outcomes shown on homepage/market pages
- `chart_records`: jodi/panel chart rows
- `pages`: optional content/page blocks
- `site_settings`: key-value settings
- `admin_users`: admin identities and roles (`superadmin` / `admin`)
- `admin_audit_log`: activity logs for admin actions

## 5) Required migrations

Run in Supabase SQL Editor (in this order):

1. `/Users/amritmandal/Downloads/Shivansh Website/supabase/migrations/0001_init.sql`
2. `/Users/amritmandal/Downloads/Shivansh Website/supabase/migrations/0002_admin_driven_market_results.sql`
3. `/Users/amritmandal/Downloads/Shivansh Website/supabase/migrations/0003_superadmin_admins.sql`

Important:
- Migration `0003_superadmin_admins.sql` is mandatory for superadmin/admin ID features.

## 6) Environment variables

Use `.env.local` in project root.

Required:
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Superadmin seed defaults (optional override):
- `SUPERADMIN_LOGIN_ID` (default: `developerdlboss.com`)
- `SUPERADMIN_PASSWORD` (default: `AmritSuperAdmin`)

Example template is in:
- `/Users/amritmandal/Downloads/Shivansh Website/.env.example`

## 7) Superadmin bootstrap

After migrations, create/ensure superadmin account:

```bash
npm run admin:create-superadmin
```

Alias command (same script):

```bash
npm run admin:create-owner
```

## 8) Commands you will use

### Run app
```bash
npm run dev
```

### Production build check
```bash
npm run build
```

### Type check
```bash
npm run typecheck
```

### Admin/public data flow test
```bash
npm run test:admin-flow
```

### E2E smoke tests (auto-starts local server)
```bash
npm run test:e2e
```

### Admin data cleanup (dangerous)
```bash
npm run admin:reset-data
```

### Ingestion scripts (optional legacy tooling)
```bash
npm run ingest:sitemap
npm run ingest:pages
npm run ingest:parse:charts
npm run ingest:parse:content
npm run ingest:extract-css
npm run ingest:seed
```

## 9) Package list

### Runtime dependencies
- `next`
- `react`
- `react-dom`
- `@supabase/ssr`
- `@supabase/supabase-js`
- `zod`
- `cheerio`

### Dev dependencies
- `typescript`
- `tsx`
- `@playwright/test`
- `eslint`
- `eslint-config-next`
- `@types/node`
- `@types/react`
- `@types/react-dom`

## 10) Code structure (important files)

## Root config
- `/Users/amritmandal/Downloads/Shivansh Website/package.json`
- `/Users/amritmandal/Downloads/Shivansh Website/next.config.js`
- `/Users/amritmandal/Downloads/Shivansh Website/playwright.config.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/tsconfig.json`

## App routes and UI
- `/Users/amritmandal/Downloads/Shivansh Website/app/layout.tsx`
- `/Users/amritmandal/Downloads/Shivansh Website/app/page.tsx`
- `/Users/amritmandal/Downloads/Shivansh Website/app/market/[slug]/page.tsx`
- `/Users/amritmandal/Downloads/Shivansh Website/app/render/[...path]/route.ts`

## Public styles
- `/Users/amritmandal/Downloads/Shivansh Website/app/globals.css`
- `/Users/amritmandal/Downloads/Shivansh Website/app/styles/base.css`
- `/Users/amritmandal/Downloads/Shivansh Website/app/styles/home.css`
- `/Users/amritmandal/Downloads/Shivansh Website/app/styles/chart.css`
- `/Users/amritmandal/Downloads/Shivansh Website/app/styles/content.css`

## Admin pages
- `/Users/amritmandal/Downloads/Shivansh Website/app/admin/login/page.tsx`
- `/Users/amritmandal/Downloads/Shivansh Website/app/admin/page.tsx`
- `/Users/amritmandal/Downloads/Shivansh Website/app/admin/markets/page.tsx`
- `/Users/amritmandal/Downloads/Shivansh Website/app/admin/results/page.tsx`
- `/Users/amritmandal/Downloads/Shivansh Website/app/admin/charts/page.tsx`
- `/Users/amritmandal/Downloads/Shivansh Website/app/admin/pages/page.tsx`
- `/Users/amritmandal/Downloads/Shivansh Website/app/admin/settings/page.tsx`
- `/Users/amritmandal/Downloads/Shivansh Website/app/admin/admins/page.tsx`

## Admin UI components
- `/Users/amritmandal/Downloads/Shivansh Website/app/admin/_components/AdminNav.tsx`
- `/Users/amritmandal/Downloads/Shivansh Website/app/admin/_components/MarketsManager.tsx`
- `/Users/amritmandal/Downloads/Shivansh Website/app/admin/_components/ResultsManager.tsx`
- `/Users/amritmandal/Downloads/Shivansh Website/app/admin/_components/ChartsManager.tsx`
- `/Users/amritmandal/Downloads/Shivansh Website/app/admin/_components/PagesManager.tsx`
- `/Users/amritmandal/Downloads/Shivansh Website/app/admin/_components/SettingsManager.tsx`
- `/Users/amritmandal/Downloads/Shivansh Website/app/admin/_components/AdminsManager.tsx`

## Admin API routes
- `/Users/amritmandal/Downloads/Shivansh Website/app/api/admin/auth/login/route.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/app/api/admin/logout/route.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/app/api/admin/markets/route.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/app/api/admin/markets/[id]/route.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/app/api/admin/results/route.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/app/api/admin/results/[id]/route.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/app/api/admin/charts/route.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/app/api/admin/charts/[id]/route.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/app/api/admin/pages/route.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/app/api/admin/pages/[id]/publish/route.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/app/api/admin/settings/route.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/app/api/admin/admins/route.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/app/api/admin/admins/[id]/route.ts`

## Business/auth/data libs
- `/Users/amritmandal/Downloads/Shivansh Website/lib/auth.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/lib/admin-api.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/lib/admin-users.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/lib/page-resolver.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/lib/dpboss-general-info.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/lib/types/index.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/lib/supabase/server.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/lib/supabase/admin.ts`

## Scripts
- `/Users/amritmandal/Downloads/Shivansh Website/scripts/load-env.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/scripts/admin/create-owner.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/scripts/admin/reset-admin-data.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/scripts/tests/admin-public-flow.ts`
- `/Users/amritmandal/Downloads/Shivansh Website/scripts/ingest/*`

## Database migrations
- `/Users/amritmandal/Downloads/Shivansh Website/supabase/migrations/0001_init.sql`
- `/Users/amritmandal/Downloads/Shivansh Website/supabase/migrations/0002_admin_driven_market_results.sql`
- `/Users/amritmandal/Downloads/Shivansh Website/supabase/migrations/0003_superadmin_admins.sql`

## Tests
- `/Users/amritmandal/Downloads/Shivansh Website/tests/e2e/smoke.spec.ts`

## Assets / static content
- `/Users/amritmandal/Downloads/Shivansh Website/public/dlboss-logo.svg`
- `/Users/amritmandal/Downloads/Shivansh Website/data/dpboss-home-source.html`

## 11) What to do when things fail

- `Missing environment variable`:
  - check `.env.local` keys and values
- `login_id column missing` while creating superadmin:
  - run migration `0003_superadmin_admins.sql`
- Login fails:
  - ensure superadmin/admin exists in both Supabase Auth and `admin_users`
  - re-run `npm run admin:create-superadmin`

## 12) Quick checklist for a fresh machine

1. Install Node.js 20+
2. `npm install`
3. Fill `.env.local`
4. Run 3 SQL migrations in Supabase
5. `npm run admin:create-superadmin`
6. `npm run dev`
7. Open:
   - Public: `http://localhost:3000`
   - Admin: `http://localhost:3000/admin/login`
