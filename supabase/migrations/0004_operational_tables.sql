create type public.checkin_source as enum ('manual', 'qr', 'kiosk', 'strava');
create type public.invite_status as enum ('pending', 'accepted', 'expired', 'revoked');
create type public.promotion_type as enum ('stripe', 'belt', 'ranking', 'achievement');

create table public.class_checkins (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  class_id uuid not null references public.club_classes(id) on delete cascade,
  member_id text not null references public.academy_members(id) on delete cascade,
  checked_in_by uuid references public.app_users(id) on delete set null,
  source public.checkin_source not null default 'manual',
  checked_in_at timestamptz not null default now(),
  notes text,
  unique (class_id, member_id)
);

create table public.coach_notes (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  member_id text not null references public.academy_members(id) on delete cascade,
  coach_user_id uuid references public.app_users(id) on delete set null,
  coach_name text not null,
  body text not null,
  visibility text not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.member_promotions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  member_id text not null references public.academy_members(id) on delete cascade,
  awarded_by uuid references public.app_users(id) on delete set null,
  awarded_by_name text not null,
  type public.promotion_type not null,
  belt public.bjj_belt,
  stripes integer,
  detail text not null,
  awarded_at timestamptz not null default now()
);

create table public.club_invites (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  email text not null,
  role public.platform_role not null default 'member',
  invited_by uuid references public.app_users(id) on delete set null,
  status public.invite_status not null default 'pending',
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (club_id, email)
);

create table public.member_goals (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  member_id text not null references public.academy_members(id) on delete cascade,
  title text not null,
  status text not null default 'active',
  target_date date,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index class_checkins_club_id_idx on public.class_checkins(club_id);
create index class_checkins_class_id_idx on public.class_checkins(class_id);
create index class_checkins_member_id_idx on public.class_checkins(member_id);
create index coach_notes_member_id_idx on public.coach_notes(member_id);
create index member_promotions_member_id_idx on public.member_promotions(member_id);
create index club_invites_club_id_idx on public.club_invites(club_id);
create index member_goals_member_id_idx on public.member_goals(member_id);

create trigger touch_coach_notes_updated_at
before update on public.coach_notes
for each row
execute function public.touch_updated_at();

alter table public.class_checkins enable row level security;
alter table public.coach_notes enable row level security;
alter table public.member_promotions enable row level security;
alter table public.club_invites enable row level security;
alter table public.member_goals enable row level security;

create policy "club members can read class checkins"
on public.class_checkins for select
using (public.current_user_club_role(club_id) is not null);

create policy "admins and coaches can manage class checkins"
on public.class_checkins for all
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "admins and coaches can read coach notes"
on public.coach_notes for select
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "admins and coaches can manage coach notes"
on public.coach_notes for all
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "club members can read promotions"
on public.member_promotions for select
using (public.current_user_club_role(club_id) is not null);

create policy "admins and coaches can manage promotions"
on public.member_promotions for all
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "owners and admins can manage invites"
on public.club_invites for all
using (public.current_user_club_role(club_id) in ('owner', 'admin'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin'));

create policy "club members can read own goals"
on public.member_goals for select
using (public.current_user_club_role(club_id) is not null);

create policy "admins and coaches can manage goals"
on public.member_goals for all
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));
