alter table public.strava_connections
add column if not exists club_id uuid references public.clubs(id) on delete cascade;

update public.strava_connections as connection
set club_id = (
  select membership.club_id
  from public.club_memberships as membership
  where membership.user_id = connection.user_id
  order by membership.joined_at asc nulls last, membership.id asc
  limit 1
)
where connection.club_id is null;

delete from public.strava_connections
where club_id is null;

alter table public.strava_connections
alter column club_id set not null;

alter table public.strava_connections
drop constraint if exists strava_connections_user_id_key;

alter table public.strava_connections
drop constraint if exists strava_connections_athlete_id_key;

alter table public.strava_connections
add constraint strava_connections_user_club_key unique (user_id, club_id);

alter table public.strava_connections
add constraint strava_connections_athlete_club_key unique (athlete_id, club_id);

create index if not exists strava_connections_club_id_idx
on public.strava_connections(club_id);

drop policy if exists "users can read own strava connection" on public.strava_connections;
create policy "users can read own club strava connection"
on public.strava_connections for select
using (
  user_id = public.current_app_user_id()
  and public.current_user_club_role(club_id) is not null
);

drop policy if exists "users can manage own strava connection" on public.strava_connections;
create policy "users can manage own club strava connection"
on public.strava_connections for all
using (
  user_id = public.current_app_user_id()
  and public.current_user_club_role(club_id) is not null
)
with check (
  user_id = public.current_app_user_id()
  and public.current_user_club_role(club_id) is not null
);
