alter table admin_users
  add column if not exists login_id text;

update admin_users
set login_id = lower(trim(email))
where login_id is null or login_id = '';

do $$
declare
  rec record;
begin
  for rec in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'admin_users'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%role%'
  loop
    execute format('alter table admin_users drop constraint if exists %I', rec.conname);
  end loop;
end $$;

alter table admin_users
  alter column login_id set not null,
  alter column role set default 'admin';

create unique index if not exists admin_users_login_id_key
on admin_users (login_id);

update admin_users
set role = 'superadmin'
where role = 'owner';

alter table admin_users
  add constraint admin_users_role_check check (role in ('superadmin', 'admin'));

create or replace function normalize_admin_user_identity()
returns trigger as $$
begin
  new.login_id = lower(trim(new.login_id));
  new.email = lower(trim(new.email));
  return new;
end;
$$ language plpgsql;

drop trigger if exists admin_users_normalize_identity on admin_users;
create trigger admin_users_normalize_identity
before insert or update on admin_users
for each row
execute function normalize_admin_user_identity();
