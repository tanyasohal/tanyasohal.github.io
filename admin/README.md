# Portfolio Admin setup

Password-protected backend at `/admin` for editing site content and viewing analytics.

## 1. Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. Wait until the database is ready.

## 2. Run the schema

1. In Supabase: **SQL Editor → New query**.
2. Paste everything from [`../supabase/schema.sql`](../supabase/schema.sql).
3. Click **Run**.

This creates:

- `site_content` (draft + published JSON)
- `projects` (Featured Work cards)
- `pageviews` (analytics)
- `site_settings`
- Storage bucket `media`
- Row Level Security policies
- Seed data matching your current portfolio

## 3. Create your login user

1. **Authentication → Users → Add user**
2. Use your email + a strong password
3. Leave “Auto Confirm User” on

Turn off public sign-ups if available (**Authentication → Providers → Email**), so only you can have an account.

## 4. Connect the admin app

1. Copy `admin/js/config.example.js` → `admin/js/config.js` (already present)
2. Open **Project Settings → API**
3. Paste:
   - **Project URL** → `supabaseUrl`
   - **anon public** key → `supabaseAnonKey`

```js
window.ADMIN_CONFIG = {
  supabaseUrl: "https://xxxx.supabase.co",
  supabaseAnonKey: "eyJhbGciOi..."
};
```

Do not commit real keys if the repo is public — `config.js` is gitignored.

## 5. Open the admin locally

From the portfolio root:

```bash
npx serve .
```

Then visit: [http://localhost:3000/admin/](http://localhost:3000/admin/)  
(or whatever port `serve` prints)

Sign in with the user you created.

## Tabs

| Tab | What it does now |
|-----|------------------|
| Overview | Visitors, views today, resume clicks, shortcuts |
| Content | Edit Hero / About / Skills / Writing / Contact / SEO; Save draft & Publish |
| Projects | Edit the 6 Featured Work cards |
| Media | Upload to Supabase Storage, copy public URL |
| Analytics | Pageviews, click events, avg time on page + Clarity link |
| Settings | Site URL, Clarity project ID + dashboard URL, change password |

## Analytics setup

1. Run [`../supabase/analytics.sql`](../supabase/analytics.sql) in the SQL Editor (one-time upgrade).
2. Copy `js/site-config.example.js` → `js/site-config.js` with the same Supabase URL + anon key as admin.
3. Create a free project at [clarity.microsoft.com](https://clarity.microsoft.com), copy the **project ID**, paste it in Admin → Settings → Clarity project ID.
4. Open the portfolio (`/`), click Resume / a project, wait a few seconds, then refresh Admin → Analytics.

## What’s next

- Wire the public `index.html` to read **published** content from Supabase

## Deploy note

Ship the `admin/` and `js/` folders with the rest of the static site. After deploy, open `https://your-domain/admin/`.
