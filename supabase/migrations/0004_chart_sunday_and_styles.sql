alter table markets
  add column if not exists show_sunday boolean not null default false,
  add column if not exists is_highlighted boolean not null default false,
  add column if not exists highlight_color text not null default '#fff200';

alter table chart_records
  add column if not exists sun text not null default '**',
  add column if not exists cell_styles jsonb not null default '{}'::jsonb;

alter table chart_records
  drop constraint if exists chart_records_cell_styles_object_check;

alter table chart_records
  add constraint chart_records_cell_styles_object_check
  check (jsonb_typeof(cell_styles) = 'object');
