drop policy if exists "staff can read dashboard events" on public.dashboard_events;
drop policy if exists "club members can read dashboard events" on public.dashboard_events;

create policy "club members can read dashboard events"
on public.dashboard_events for select
using (public.current_user_club_role(club_id) is not null);

comment on policy "club members can read dashboard events" on public.dashboard_events is
'Dashboard is available to every club role in the app. Events stay read-only from client roles, but any active club membership can read its club dashboard events.';
