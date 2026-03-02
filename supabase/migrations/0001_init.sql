create extension if not exists "pgcrypto";

create table if not exists markets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  sort_order integer not null default 999,
  has_jodi boolean not null default true,
  has_panel boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chart_records (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references markets(id) on delete cascade,
  chart_type text not null check (chart_type in ('jodi', 'panel')),
  week_start date not null,
  week_end date not null,
  mon text not null,
  tue text not null,
  wed text not null,
  thu text not null,
  fri text not null,
  sat text not null,
  source_year_label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_id, chart_type, week_start)
);

create index if not exists chart_records_market_type_week_idx
on chart_records (market_id, chart_type, week_start);

create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  page_type text not null check (page_type in ('home', 'chart', 'content', 'utility')),
  title text not null,
  meta_description text,
  meta_keywords text,
  canonical_url text,
  body_blocks jsonb,
  raw_html_snapshot text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pages_published_idx on pages (is_published, path);

create table if not exists site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  email text not null unique,
  role text not null default 'owner' check (role in ('owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_auth_user_id uuid,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists markets_touch_updated_at on markets;
create trigger markets_touch_updated_at before update on markets for each row execute function touch_updated_at();

drop trigger if exists chart_records_touch_updated_at on chart_records;
create trigger chart_records_touch_updated_at before update on chart_records for each row execute function touch_updated_at();

drop trigger if exists pages_touch_updated_at on pages;
create trigger pages_touch_updated_at before update on pages for each row execute function touch_updated_at();

drop trigger if exists site_settings_touch_updated_at on site_settings;
create trigger site_settings_touch_updated_at before update on site_settings for each row execute function touch_updated_at();

drop trigger if exists admin_users_touch_updated_at on admin_users;
create trigger admin_users_touch_updated_at before update on admin_users for each row execute function touch_updated_at();

alter table markets enable row level security;
alter table chart_records enable row level security;
alter table pages enable row level security;
alter table site_settings enable row level security;
alter table admin_users enable row level security;
alter table admin_audit_log enable row level security;

drop policy if exists "public can read published pages" on pages;
create policy "public can read published pages"
on pages
for select
using (is_published = true);

drop policy if exists "authenticated can read markets" on markets;
create policy "authenticated can read markets"
on markets
for select
using (auth.role() = 'authenticated');

drop policy if exists "authenticated can read chart_records" on chart_records;
create policy "authenticated can read chart_records"
on chart_records
for select
using (auth.role() = 'authenticated');

drop policy if exists "authenticated can read settings" on site_settings;
create policy "authenticated can read settings"
on site_settings
for select
using (auth.role() = 'authenticated');

drop policy if exists "authenticated can read own admin record" on admin_users;
create policy "authenticated can read own admin record"
on admin_users
for select
using (auth.uid() = auth_user_id);
