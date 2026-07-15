-- BoothPH — Supabase Schema (hardened)
-- Run this in your Supabase project's SQL Editor (Database → SQL Editor → New query).
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS guards.

-- ─────────────────────────────────────────────
-- 1. TABLES
-- ─────────────────────────────────────────────

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_code text not null unique,
  layout_id text not null,
  filter_id text,
  frame_color text,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.session_photos (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on public.sessions(user_id);
create index if not exists sessions_created_at_idx on public.sessions(created_at);
create index if not exists session_photos_session_id_idx on public.session_photos(session_id);

-- ─────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY — locked down by design.
--
-- All writes (insert/update/delete) happen ONLY from the server, via
-- app/api/upload-session/route.js, using the service role key — which
-- bypasses RLS entirely. That means these tables intentionally have NO
-- insert/update/delete policies for the anon/authenticated roles: the
-- browser's anon key can only ever SELECT. This closes off the spam/abuse
-- path where anyone with devtools open could hit the database directly.
-- ─────────────────────────────────────────────

alter table public.sessions enable row level security;
alter table public.session_photos enable row level security;

-- Public read access, scoped to what the app actually needs:
-- the QR-sharing flow looks up a session's photo by its (unguessable,
-- random) session_code, and the gallery page looks up a signed-in user's
-- own rows. Neither requires exposing a "browse everything" query pattern,
-- but Postgres RLS itself can't distinguish "queried by code" from
-- "queried in bulk" — if you want to fully prevent bulk scraping, remove
-- the public select policy below and read only through a server route
-- instead (same pattern as the upload route).
drop policy if exists "Anyone can insert a session" on public.sessions;
drop policy if exists "Anyone can insert session photos" on public.session_photos;

drop policy if exists "Owners can read their sessions" on public.sessions;
create policy "Owners can read their sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Anyone can read a session by code" on public.sessions;
create policy "Anyone can read a session by code"
  on public.sessions for select
  using (true);

drop policy if exists "Anyone can read session photos" on public.session_photos;
create policy "Anyone can read session photos"
  on public.session_photos for select
  using (true);

-- ─────────────────────────────────────────────
-- 3. STORAGE BUCKET
-- ─────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('boothph-outputs', 'boothph-outputs', true)
on conflict (id) do nothing;

drop policy if exists "Public read access on boothph-outputs" on storage.objects;
create policy "Public read access on boothph-outputs"
  on storage.objects for select
  using (bucket_id = 'boothph-outputs');

-- No insert/update/delete policy for storage.objects either — uploads only
-- happen server-side via the service role key, same reasoning as above.
drop policy if exists "Anyone can upload to boothph-outputs" on storage.objects;

-- ─────────────────────────────────────────────
-- 4. SCHEDULED CLEANUP (pg_cron + pg_net)
--
-- This calls the `cleanup-old-sessions` Edge Function every hour. Deploy
-- the function first: `supabase functions deploy cleanup-old-sessions`
-- Then set a shared secret both places:
--   supabase secrets set CLEANUP_FUNCTION_SECRET=your-long-random-string
-- and paste the same string into the `Authorization` header below.
-- ─────────────────────────────────────────────

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'boothph-cleanup-old-sessions',
  '0 * * * *', -- every hour, on the hour
  $$
  select net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/cleanup-old-sessions',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_CLEANUP_FUNCTION_SECRET',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To check it's registered:      select * from cron.job;
-- To see run history:            select * from cron.job_run_details order by start_time desc limit 10;
-- To remove it:                  select cron.unschedule('boothph-cleanup-old-sessions');

-- ─────────────────────────────────────────────
-- Done! After running this, set the env vars listed in .env.local.example
-- (including SUPABASE_SERVICE_ROLE_KEY, server-only) and restart the app.
-- ─────────────────────────────────────────────
