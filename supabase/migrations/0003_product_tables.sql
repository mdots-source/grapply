create table public.competitions (
  id text primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  date_text text not null,
  location text not null,
  city text not null,
  venue text not null,
  registered_member_ids text[] not null default '{}',
  registration_deadline text not null,
  status text not null,
  notes text not null,
  type text not null,
  prep integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.training_camps (
  id text primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  date_text text not null,
  end_date_text text not null,
  location text not null,
  city text not null,
  venue text not null,
  host text not null,
  focus text not null,
  registered_member_ids text[] not null default '{}',
  registration_deadline text not null,
  status text not null,
  notes text not null,
  type text not null,
  prep integer not null default 0,
  spots_total integer not null default 0,
  estimated_cost text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.training_posts (
  id text primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  type text not null,
  pinned boolean not null default false,
  class_name text,
  coach text not null,
  date_text text not null,
  time_text text not null,
  title text not null,
  summary text not null,
  attendance integer,
  top_participant jsonb,
  sparring_highlight text,
  achievements text[],
  tagged_students text[],
  reactions integer not null default 0,
  comments integer not null default 0,
  heat integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dashboard_events (
  id text primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  category text not null,
  title text not null,
  body text,
  actor text,
  meta jsonb not null default '{}'::jsonb,
  occurred_at_text text not null,
  created_at timestamptz not null default now()
);

create table public.club_settings (
  club_id uuid not null references public.clubs(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (club_id, key)
);

create index competitions_club_id_idx on public.competitions(club_id);
create index training_camps_club_id_idx on public.training_camps(club_id);
create index training_posts_club_id_idx on public.training_posts(club_id);
create index training_posts_heat_idx on public.training_posts(heat desc);
create index dashboard_events_club_id_idx on public.dashboard_events(club_id);

create trigger touch_competitions_updated_at
before update on public.competitions
for each row
execute function public.touch_updated_at();

create trigger touch_training_camps_updated_at
before update on public.training_camps
for each row
execute function public.touch_updated_at();

create trigger touch_training_posts_updated_at
before update on public.training_posts
for each row
execute function public.touch_updated_at();

create trigger touch_club_settings_updated_at
before update on public.club_settings
for each row
execute function public.touch_updated_at();

alter table public.competitions enable row level security;
alter table public.training_camps enable row level security;
alter table public.training_posts enable row level security;
alter table public.dashboard_events enable row level security;
alter table public.club_settings enable row level security;

create policy "club members can read competitions"
on public.competitions for select
using (public.current_user_club_role(club_id) is not null);

create policy "admins and coaches can manage competitions"
on public.competitions for all
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "club members can read training camps"
on public.training_camps for select
using (public.current_user_club_role(club_id) is not null);

create policy "admins and coaches can manage training camps"
on public.training_camps for all
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "club members can read training posts"
on public.training_posts for select
using (public.current_user_club_role(club_id) is not null);

create policy "admins and coaches can manage training posts"
on public.training_posts for all
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "club members can read dashboard events"
on public.dashboard_events for select
using (public.current_user_club_role(club_id) is not null);

create policy "admins and coaches can manage dashboard events"
on public.dashboard_events for all
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "club members can read settings"
on public.club_settings for select
using (public.current_user_club_role(club_id) is not null);

create policy "owners and admins can manage settings"
on public.club_settings for all
using (public.current_user_club_role(club_id) in ('owner', 'admin'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin'));
