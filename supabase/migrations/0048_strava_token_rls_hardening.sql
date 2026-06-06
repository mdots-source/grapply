drop policy if exists "users can read own strava connection" on public.strava_connections;
drop policy if exists "users can read own club strava connection" on public.strava_connections;
drop policy if exists "users can manage own strava connection" on public.strava_connections;
drop policy if exists "users can manage own club strava connection" on public.strava_connections;

drop policy if exists "users can manage own strava activities" on public.strava_activities;

drop policy if exists "users can read own strava activities" on public.strava_activities;
create policy "users can read own strava activities"
on public.strava_activities for select
using (
  user_id = public.current_app_user_id()
  and public.current_user_club_role(club_id) is not null
);
