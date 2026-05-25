create type public.bjj_belt as enum ('white', 'blue', 'purple', 'brown', 'black');
create type public.member_role as enum ('member', 'coach');
create type public.member_status as enum ('active', 'inactive');

create table public.academy_members (
  id text primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  belt public.bjj_belt not null,
  stripes integer not null default 0,
  role public.member_role not null default 'member',
  status public.member_status not null default 'active',
  total_hours integer not null default 0,
  classes_30 integer not null default 0,
  streak integer not null default 0,
  points integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  last_seen text not null,
  focus text not null,
  avatar_url text,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index academy_members_club_id_idx on public.academy_members(club_id);
create index academy_members_points_idx on public.academy_members(points desc);
create index academy_members_hierarchy_idx on public.academy_members(role, belt, stripes desc);

create trigger touch_academy_members_updated_at
before update on public.academy_members
for each row
execute function public.touch_updated_at();

alter table public.academy_members enable row level security;

create policy "club members can read academy members"
on public.academy_members for select
using (public.current_user_club_role(club_id) is not null);

create policy "admins and coaches can manage academy members"
on public.academy_members for all
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));
