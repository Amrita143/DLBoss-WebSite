# Detailed Deployment Guide (Vercel + Supabase + GoDaddy)

This guide is written for first-time deployment.

Target production domain:
- `https://dlbosss.com/`

Tech stack in production:
- Hosting: Vercel
- Database/Auth: Supabase
- Domain registrar: GoDaddy
- CI (code checks): GitHub Actions
- CD (auto deploy): Vercel Git integration

---

## 1) Prerequisites (one-time)

Create these accounts (if not already):
- GitHub
- Vercel
- Supabase
- GoDaddy (already done)

Install locally:
- Node.js 20+
- npm
- Git

---

## 2) Put project in GitHub

From project root (`/Users/amritmandal/Downloads/Shivansh Website`):

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

If repository already exists, just commit/push latest changes.

---

## 3) Setup Supabase (database + auth)

### 3.1 Create project
1. Open Supabase dashboard.
2. Create new project.
3. Save:
- Project URL
- Anon key
- Service role key

### 3.2 Run SQL migrations
In Supabase SQL Editor, run files in exact order:

1. `/Users/amritmandal/Downloads/Shivansh Website/supabase/migrations/0001_init.sql`
2. `/Users/amritmandal/Downloads/Shivansh Website/supabase/migrations/0002_admin_driven_market_results.sql`
3. `/Users/amritmandal/Downloads/Shivansh Website/supabase/migrations/0003_superadmin_admins.sql`

Do not skip `0003`, it enables superadmin/admin ID features.

### 3.3 Create superadmin
In local project `.env.local`, ensure:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPERADMIN_LOGIN_ID=developerdlboss.com
SUPERADMIN_PASSWORD=AmritSuperAdmin
```

Then run:

```bash
npm install
npm run admin:create-superadmin
```

Expected result: superadmin account is created/ensured.

---

## 4) Deploy to Vercel (automatic CD)

### 4.1 Import project
1. Log in to Vercel.
2. Click **Add New Project**.
3. Import your GitHub repository.
4. Framework should be detected as Next.js.

### 4.2 Configure environment variables in Vercel
In Vercel Project Settings -> Environment Variables, add:

- `NEXT_PUBLIC_SITE_URL` = `https://dlbosss.com`
- `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
- `SUPABASE_SERVICE_ROLE_KEY` = your service role key

Optional (kept for scripts/manual reseed):
- `SUPERADMIN_LOGIN_ID` = `developerdlboss.com`
- `SUPERADMIN_PASSWORD` = `AmritSuperAdmin`

### 4.3 Deploy
- Click **Deploy**.
- After build success, you will get a Vercel URL.

From now on:
- every push to `main` auto-deploys to production (CD).

---

## 5) Connect GoDaddy domain (`dlbosss.com`)

### 5.1 Add domain in Vercel
1. Open Vercel project -> **Settings -> Domains**.
2. Add:
- `dlbosss.com`
- `www.dlbosss.com`

### 5.2 Configure GoDaddy DNS
In GoDaddy DNS Management, create/update:

1. `A` record
- Host: `@`
- Value: `76.76.21.21`
- TTL: default

2. `CNAME` record
- Host: `www`
- Value: `cname.vercel-dns.com`
- TTL: default

Note:
- If Vercel shows different DNS values in dashboard, use Vercel-provided values.

### 5.3 Wait for propagation
- Usually 5 minutes to 1 hour (sometimes up to 24 hours).
- Verify in Vercel domain page until status is **Valid**.

### 5.4 Force canonical domain
In Vercel domain settings:
- Set `dlbosss.com` as primary domain.
- Redirect `www.dlbosss.com` -> `dlbosss.com`.

---

## 6) CI setup (automatic checks on push/PR)

Already added in repo:
- `/Users/amritmandal/Downloads/Shivansh Website/.github/workflows/ci.yml`

What it does automatically:
- `npm ci`
- `npm run typecheck`
- `npm run build`

Triggers:
- every push to `main`/`master`
- every pull request

So your flow becomes:
1. Push code to GitHub.
2. GitHub Actions validates build.
3. Vercel auto deploys (if push to production branch).

---

## 7) Post-deploy test checklist

After first deployment, verify:

1. Public site opens on `https://dlbosss.com/`.
2. Admin login page opens: `https://dlbosss.com/admin/login`.
3. Superadmin login works with:
- ID: `developerdlboss.com`
- Password: `AmritSuperAdmin`
4. In `/admin/admins`, create one test admin.
5. Login with test admin and confirm access.
6. Create/update market and outcome in admin panel.
7. Confirm new result appears on public homepage.
8. Delete test admin from superadmin panel.

---

## 8) Daily update workflow (very simple)

### Content updates (no code)
- Login to admin panel.
- Update markets/results/charts.
- Public website updates immediately from DB.

### Code updates
1. Edit code locally.
2. Commit + push to GitHub `main`.
3. CI runs automatically.
4. Vercel deploys automatically.

---

## 9) When database schema changes in future

If you add a new SQL migration file:

1. Commit migration file under:
- `/Users/amritmandal/Downloads/Shivansh Website/supabase/migrations/`
2. Apply migration in Supabase SQL Editor.
3. Then push/deploy app code.

(You can automate DB migration later with Supabase CLI + GitHub secrets, but keep manual mode until you are comfortable.)

---

## 10) Rollback plan

If a deployment breaks:
1. Open Vercel project -> **Deployments**.
2. Select last working deployment.
3. Click **Promote to Production**.

If DB data issue happens:
- restore from Supabase backups or manually fix rows from admin panel/SQL.

---

## 11) Common issues and fixes

### `Missing environment variable` in Vercel logs
- Recheck all required env vars in Vercel Project Settings.
- Redeploy after saving env vars.

### `login_id column missing` when creating superadmin
- Run migration `0003_superadmin_admins.sql`.
- Re-run `npm run admin:create-superadmin`.

### Domain not opening after DNS update
- Wait longer for propagation.
- Confirm records match Vercel instructions.
- Remove conflicting old A/CNAME records.

### Admin cannot login
- Ensure account exists in `admin_users`.
- Ensure Supabase Auth user exists.
- Recreate with superadmin panel or run `npm run admin:create-superadmin` for root account.

---

## 12) Recommended production hygiene

- Keep `SUPABASE_SERVICE_ROLE_KEY` only in server environment (never expose in frontend).
- Use strong passwords for all admins.
- Keep only 1-2 superadmin accounts.
- Rotate credentials if leaked.
- Protect `main` branch in GitHub.
- Enable 2FA on GitHub, Supabase, and Vercel accounts.
