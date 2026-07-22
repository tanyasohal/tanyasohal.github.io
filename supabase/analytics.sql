-- Analytics upgrade: run once in Supabase SQL Editor
-- Adds events table, clarity_project_id, and API grants

-- ---------------------------------------------------------------------------
-- Events (clicks, time-on-page, etc.)
-- ---------------------------------------------------------------------------

create table if not exists public.events (
  id bigserial primary key,
  name text not null,
  path text,
  label text,
  visitor_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_created_at_idx on public.events (created_at desc);
create index if not exists events_name_idx on public.events (name);

alter table public.events enable row level security;

drop policy if exists "Anon insert events" on public.events;
create policy "Anon insert events"
  on public.events for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Auth read events" on public.events;
create policy "Auth read events"
  on public.events for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Clarity project id on settings (for embedding the script)
-- ---------------------------------------------------------------------------

alter table public.site_settings
  add column if not exists clarity_project_id text not null default '';

-- ---------------------------------------------------------------------------
-- Grants (needed when "Automatically expose new tables" is off)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.projects to authenticated;
grant select on public.projects to anon;

grant select, insert, update, delete on public.site_content to authenticated;

grant select, insert on public.pageviews to anon, authenticated;
grant select on public.pageviews to authenticated;

grant select, insert on public.events to anon, authenticated;
grant select on public.events to authenticated;

grant select, insert, update, delete on public.site_settings to authenticated;
grant select on public.site_settings to anon;

grant usage, select on all sequences in schema public to anon, authenticated;
