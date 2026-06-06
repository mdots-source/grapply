drop policy if exists "users can read own strava activities" on public.strava_activities;
create policy "users can read own strava activities"
on public.strava_activities for select
using (
  user_id = public.current_app_user_id()
  and public.current_user_club_role(club_id) is not null
);

drop policy if exists "users can manage own strava activities" on public.strava_activities;
create policy "users can manage own strava activities"
on public.strava_activities for all
using (
  user_id = public.current_app_user_id()
  and public.current_user_club_role(club_id) is not null
)
with check (
  user_id = public.current_app_user_id()
  and public.current_user_club_role(club_id) is not null
);
