# Admin-Driven Market Results Webapp

This app is now fully backend-governed by Admin data only.

## What changed

- Public UI reads only from `markets`, `market_results`, and `chart_records`.
- Scraped page snapshots are no longer rendered on frontend.
- `.php` routes are supported only for chart pages:
  - `/jodi-chart-record/:slug.php`
  - `/panel-chart-record/:slug.php`
- Admin can manage:
  - markets (create/update/delete, timings, active status)
  - outcomes (`market_results`)
  - chart records (`chart_records`)

## Setup

```bash
npm install
cp .env.example .env.local
```

Use `KEY=value` format in env files (no spaces around `=`).

## Database migrations

Apply both SQL files in Supabase SQL Editor:

- `/Users/amritmandal/Downloads/Shivansh Website/supabase/migrations/0001_init.sql`
- `/Users/amritmandal/Downloads/Shivansh Website/supabase/migrations/0002_admin_driven_market_results.sql`

## Owner account

```bash
npm run admin:create-owner
```

## Optional cleanup (remove scraped/imported data)

```bash
npm run admin:reset-data
```

This clears markets, outcomes, chart records, and pages so you can run purely admin-managed data.

## Run app

```bash
npm run dev
```

- Public: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Validate admin-to-frontend reflection

```bash
npm run test:admin-flow
```

This script creates temporary market/outcome/chart rows, verifies they are visible to frontend resolver logic, then cleans test data.

## Optional browser smoke tests

```bash
npm run test:e2e
```
