alter table market_results
  add column if not exists is_live_result boolean not null default false;

create index if not exists market_results_live_result_idx
on market_results (is_live_result, result_date desc);
