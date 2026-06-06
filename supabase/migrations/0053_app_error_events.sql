create table if not exists public.app_error_events (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  source text not null,
  severity text not null default 'error',
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_error_events_created_at_idx
on public.app_error_events(created_at desc);

create index if not exists app_error_events_request_id_idx
on public.app_error_events(request_id);

alter table public.app_error_events enable row level security;
alter table public.app_error_events force row level security;

drop policy if exists "owners can read app error events" on public.app_error_events;
create policy "owners can read app error events"
on public.app_error_events for select
using (exists (
  select 1
  from public.club_memberships as membership
  where membership.user_id = public.current_app_user_id()
    and membership.role = 'owner'
));

comment on table public.app_error_events is
'Backend observability events keyed by request id. Inserts are done by the service role; owners can read events for support and demo debugging.';
