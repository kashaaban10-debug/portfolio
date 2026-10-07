-- Execute once in your own Supabase project's SQL Editor.
-- Only public anon/publishable key goes in config.json. Never put service_role in client files.
create table if not exists public.learner_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint progress_size_limit check (octet_length(data::text) < 2000000)
);
alter table public.learner_progress enable row level security;
revoke all on public.learner_progress from anon;
grant select, insert, update, delete on public.learner_progress to authenticated;
drop policy if exists "Own progress only" on public.learner_progress;
create policy "Own progress only" on public.learner_progress
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
