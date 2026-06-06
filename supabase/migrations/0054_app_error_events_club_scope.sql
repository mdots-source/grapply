alter table public.app_error_events
add column if not exists club_id uuid references public.clubs(id) on delete set null;

create index if not exists app_error_events_club_created_at_idx
on public.app_error_events(club_id, created_at desc);

drop policy if exists "owners can read app error events" on public.app_error_events;
drop policy if exists "owners can read own club error events" on public.app_error_events;
create policy "owners can read own club error events"
on public.app_error_events for select
using (
  club_id is not null
  and exists (
    select 1
    from public.club_memberships as membership
    where membership.club_id = app_error_events.club_id
      and membership.user_id = public.current_app_user_id()
      and membership.role = 'owner'
  )
);

comment on table public.app_error_events is
'Backend observability events keyed by request id. Inserts are done by the service role; owners can read only events scoped to clubs they own.';
