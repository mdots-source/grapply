create table if not exists public.strava_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  activity_id text not null,
  name text not null,
  sport_type text not null,
  start_date timestamptz not null,
  distance_meters numeric,
  moving_time_seconds integer,
  elapsed_time_seconds integer,
  elevation_gain_meters numeric,
  average_heartrate numeric,
  suffer_score numeric,
  raw jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, club_id, activity_id)
);

create index if not exists strava_activities_user_id_idx on public.strava_activities(user_id);
create index if not exists strava_activities_club_id_idx on public.strava_activities(club_id);
create index if not exists strava_activities_start_date_idx on public.strava_activities(start_date desc);

alter table public.strava_activities enable row level security;

create policy "users can read own strava activities"
on public.strava_activities for select
using (
  user_id = public.current_app_user_id()
  and public.current_user_club_role(club_id) is not null
);

create policy "club staff can read strava activities"
on public.strava_activities for select
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

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
