alter table markets
  add column if not exists open_time text,
  add column if not exists close_time text;

update markets
set
  open_time = coalesce(open_time, ''),
  close_time = coalesce(close_time, '')
where open_time is null or close_time is null;

create table if not exists market_results (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references markets(id) on delete cascade,
  result_date date not null,
  open_panna text,
  open_ank text,
  close_panna text,
  close_ank text,
  jodi text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_id, result_date)
);

create index if not exists market_results_market_date_idx
on market_results (market_id, result_date desc);

alter table market_results enable row level security;

drop trigger if exists market_results_touch_updated_at on market_results;
create trigger market_results_touch_updated_at
before update on market_results
for each row
execute function touch_updated_at();

drop policy if exists "authenticated can read market_results" on market_results;
create policy "authenticated can read market_results"
on market_results
for select
using (auth.role() = 'authenticated');
