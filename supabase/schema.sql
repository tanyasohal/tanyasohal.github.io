-- Portfolio admin schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Then create your Auth user (Dashboard → Authentication → Users → Add user).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.site_content (
  id text primary key default 'main',
  draft jsonb not null default '{}'::jsonb,
  published jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  tag text not null default '',
  thumbnail_url text not null default '',
  href text not null default '',
  sort_order int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pageviews (
  id bigserial primary key,
  path text not null,
  referrer text,
  visitor_id text,
  device text,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id bigserial primary key,
  name text not null,
  path text,
  label text,
  visitor_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists pageviews_created_at_idx on public.pageviews (created_at desc);
create index if not exists pageviews_path_idx on public.pageviews (path);
create index if not exists events_created_at_idx on public.events (created_at desc);
create index if not exists events_name_idx on public.events (name);
create index if not exists projects_sort_order_idx on public.projects (sort_order);

create table if not exists public.site_settings (
  id text primary key default 'main',
  site_url text not null default '',
  clarity_url text not null default '',
  clarity_project_id text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Updated-at helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_content_updated_at on public.site_content;
create trigger site_content_updated_at
  before update on public.site_content
  for each row execute function public.set_updated_at();

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed: site content (matches current index.html)
-- ---------------------------------------------------------------------------

with seed as (
  select '{
    "hero": {
      "greeting": "👋 Hi, I''m Tanya",
      "headlineHtml": "I like driving product decisions using <span class=\"outlined\">data</span> <span class=\"nowrap\"><span class=\"outlined\">analytics</span>, <span class=\"outlined\">strategy</span> & <span class=\"outlined\">AI</span>.</span>",
      "resumeUrl": "https://drive.google.com/file/d/1pW32QGBf2xFftherbgbcDqWgkzZwHIg6/view?usp=sharing"
    },
    "about": {
      "title": "About Me.",
      "paragraphs": [
        "Can I analyze the \"messy data\" everyone keeps talking about? Yes, I can. And that''s honestly the easy part. The harder, more useful skill is knowing what to do with the answer, which is where product decisions come in.",
        "I have 2+ years turning ambiguous data into calls that teams actually make, from dashboards that get checked every day to strategy that shapes what gets built next. Right now I''m doing this as an AI Data Analyst at OneUp, directly helping the founders build the product dashboard.",
        "I back this up with an MS in Business Analytics from the University of Rochester, completed in December 2025."
      ],
      "photoUrl": "images/about-photo.jpg"
    },
    "skills": {
      "title": "What I Bring to the Table.",
      "subtitle": "Years of delivering insights across different industries has sharpened a specific, powerful skill set.",
      "categories": [
        {
          "name": "Data Analysis & Scripting",
          "tools": [
            {"label": "Python", "icon": "images/skills/python.png"},
            {"label": "SQL", "icon": "images/skills/sql.jpg"},
            {"label": "R", "icon": "images/skills/r-programming.png"},
            {"label": "Excel", "icon": "images/skills/excel.jpg"}
          ]
        },
        {
          "name": "Data Engineering & Cloud",
          "tools": [
            {"label": "Databricks", "icon": "images/skills/databricks.jpg"},
            {"label": "Snowflake", "icon": "images/skills/snowflake.png"},
            {"label": "AWS", "icon": "images/skills/aws.png"},
            {"label": "Spark", "icon": "images/skills/spark.jpg"},
            {"label": "Docker", "icon": "images/skills/docker.png", "extra": true}
          ]
        },
        {
          "name": "BI, Design & Workflow",
          "tools": [
            {"label": "Power BI", "icon": "images/skills/powerBI.png"},
            {"label": "Tableau", "icon": "images/skills/tableau.png"},
            {"label": "Metabase", "icon": "images/skills/metabase.png"},
            {"label": "Notion", "icon": "images/skills/notion.png"},
            {"label": "Figma", "icon": "images/skills/figma.png", "extra": true},
            {"label": "Jira", "icon": "images/skills/jira.png", "extra": true},
            {"label": "Confluence", "icon": "images/skills/confluence.png", "extra": true}
          ]
        },
        {
          "name": "AI & Machine Learning",
          "tools": [
            {"label": "Claude", "icon": "images/skills/claude.png"},
            {"label": "Cursor", "icon": "images/skills/cursor.png", "noKnockout": true},
            {"label": "scikit-learn", "icon": "images/skills/scikit.jpg"},
            {"label": "PyTorch", "icon": "images/skills/pytorch.jpg"},
            {"label": "TensorFlow", "icon": "images/skills/tensorflow.png", "extra": true},
            {"label": "LangChain", "icon": "images/skills/langchain.jpg", "extra": true},
            {"label": "ChatGPT", "icon": "images/skills/chatgpt.jpg", "extra": true}
          ]
        }
      ]
    },
    "writing": {
      "title": "Writing.",
      "subtitle": "My learning journal. Notes on data, product thinking, AI, and figuring things out as I go.",
      "substackUrl": "https://tanyasohal.substack.com",
      "buttonLabel": "visit my substack..."
    },
    "contact": {
      "title": "I''m always up for a chat.",
      "intro": "Whether it''s about data, a role you think I''d be great for, or a good podcast recommendation.",
      "email": "tanyasohal01@gmail.com",
      "linkedinUrl": "https://www.linkedin.com/in/tanya-sohal/",
      "githubUrl": "https://github.com/tanyasohal",
      "tableauUrl": "https://public.tableau.com/app/profile/tanyasohal"
    },
    "seo": {
      "title": "Tanya Sohal",
      "description": "Portfolio of Tanya Sohal — data analytics, product strategy, and AI.",
      "ogImage": "images/about-photo.jpg"
    },
    "work": {
      "title": "Featured Work.",
      "subtitle": "A selection of work that has driven real data-backed business insights."
    }
  }'::jsonb as data
)
insert into public.site_content (id, draft, published, published_at)
select 'main', data, data, now() from seed
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Seed: projects
-- ---------------------------------------------------------------------------

insert into public.projects (slug, title, tag, thumbnail_url, href, sort_order, visible)
values
  ('oneup', 'Real-Time User Behavior Tracking for OneUp, an Edtech Startup', 'Product Analytics', 'images/work/oneup.jpg', 'work/oneup.html', 1, true),
  ('craigslist', 'Uncovering Customer Pain Points on Craigslist with ML', 'NLP & Text Analytics', 'images/work/craigslist.jpg', 'work/craigslist.html', 2, true),
  ('perrys', 'Manufacturing Optimization for Perry''s Ice Cream', 'Operations Analytics', 'images/work/perrys.jpg', 'work/perrys.html', 3, true),
  ('dvd-warehouse', 'End-to-End Data Warehouse Pipeline for a Rental Company', 'Data Engineering', 'images/work/dvd-warehouse.jpg', 'work/dvd-warehouse.html', 4, true),
  ('grant-writer', 'A Conversational AI Assistant for Grant Proposal Writing', 'GenAI', 'images/work/grant-writer.jpg', 'work/grant-writer.html', 5, true),
  ('employee-training', 'Evaluating Employee Training Impact through Data Analytics', 'People Analytics', 'images/work/employee-training.jpg', 'work/employee-training.html', 6, true)
on conflict (slug) do nothing;

insert into public.site_settings (id, site_url, clarity_url, clarity_project_id)
values ('main', '', '', '')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.site_content enable row level security;
alter table public.projects enable row level security;
alter table public.pageviews enable row level security;
alter table public.events enable row level security;
alter table public.site_settings enable row level security;

-- Public can read site_content rows (draft is still in the row — use the view below for public apps).
-- Admin uses authenticated access to draft.
drop policy if exists "Public read site_content" on public.site_content;
create policy "Public read site_content"
  on public.site_content for select
  to authenticated
  using (true);

drop policy if exists "Anon read published via view only" on public.site_content;
-- anon has no direct select on site_content

create or replace view public.published_content
with (security_invoker = false)
as
select id, published, published_at
from public.site_content
where id = 'main';

grant select on public.published_content to anon, authenticated;

drop policy if exists "Auth write site_content" on public.site_content;
create policy "Auth write site_content"
  on public.site_content for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Public read projects" on public.projects;
create policy "Public read projects"
  on public.projects for select
  to anon, authenticated
  using (visible = true or auth.role() = 'authenticated');

drop policy if exists "Auth write projects" on public.projects;
create policy "Auth write projects"
  on public.projects for all
  to authenticated
  using (true)
  with check (true);

-- Anyone can insert pageviews (beacon); only auth can read
drop policy if exists "Anon insert pageviews" on public.pageviews;
create policy "Anon insert pageviews"
  on public.pageviews for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Auth read pageviews" on public.pageviews;
create policy "Auth read pageviews"
  on public.pageviews for select
  to authenticated
  using (true);

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

drop policy if exists "Public read settings" on public.site_settings;
create policy "Public read settings"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Auth write settings" on public.site_settings;
create policy "Auth write settings"
  on public.site_settings for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Storage bucket for media uploads
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "Public read media" on storage.objects;
create policy "Public read media"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "Auth upload media" on storage.objects;
create policy "Auth upload media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media');

drop policy if exists "Auth update media" on storage.objects;
create policy "Auth update media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');

drop policy if exists "Auth delete media" on storage.objects;
create policy "Auth delete media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media');

-- ---------------------------------------------------------------------------
-- API grants (required when auto-expose tables is disabled)
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
