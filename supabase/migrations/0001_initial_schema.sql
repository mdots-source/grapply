create extension if not exists pgcrypto;

create type public.club_status as enum ('active', 'pending', 'archived');
create type public.platform_role as enum ('owner', 'admin', 'coach', 'member');

create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  avatar_url text,
  belt text default 'white' check (belt in ('white', 'blue', 'purple', 'brown', 'black')),
  stripes integer default 0 check (stripes between 0 and 4),
  created_at timestamptz not null default now()
);

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  location text not null,
  status public.club_status not null default 'active',
  member_count integer not null default 0,
  primary_coach text not null,
  created_at timestamptz not null default now()
);

create table public.club_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  role public.platform_role not null default 'member',
  invited_by text,
  joined_at date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, club_id)
);

create table public.role_definitions (
  role public.platform_role primary key,
  label text not null,
  description text not null,
  permissions text[] not null default '{}'
);

create table public.club_classes (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  coach text not null,
  day text not null,
  time text not null,
  mat text not null,
  level text not null,
  duration_minutes integer not null default 60 check (duration_minutes between 15 and 240),
  checked_in integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.strava_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  athlete_id text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at bigint not null,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, club_id),
  unique (athlete_id, club_id)
);

create table public.club_billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  plan text not null default 'starter' check (plan in ('starter', 'growth', 'pro', 'enterprise')),
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  billing_email text,
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  seats_included integer not null default 50 check (seats_included > 0),
  member_limit integer not null default 250 check (member_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id)
);

create index club_memberships_user_id_idx on public.club_memberships(user_id);
create index club_memberships_club_id_idx on public.club_memberships(club_id);
create index club_classes_club_id_idx on public.club_classes(club_id);
create index strava_connections_user_id_idx on public.strava_connections(user_id);
create index strava_connections_club_id_idx on public.strava_connections(club_id);
create index club_billing_subscriptions_club_id_idx on public.club_billing_subscriptions(club_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_strava_connections_updated_at
before update on public.strava_connections
for each row
execute function public.touch_updated_at();

create trigger touch_club_billing_subscriptions_updated_at
before update on public.club_billing_subscriptions
for each row
execute function public.touch_updated_at();

alter table public.app_users enable row level security;
alter table public.clubs enable row level security;
alter table public.club_memberships enable row level security;
alter table public.role_definitions enable row level security;
alter table public.club_classes enable row level security;
alter table public.strava_connections enable row level security;
alter table public.club_billing_subscriptions enable row level security;

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.app_users where auth_user_id = auth.uid()
$$;

create or replace function public.current_user_club_role(target_club_id uuid)
returns public.platform_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.club_memberships
  where user_id = public.current_app_user_id()
    and club_id = target_club_id
  limit 1
$$;

create policy "users can read own profile"
on public.app_users for select
using (auth_user_id = auth.uid());

create policy "users can read clubs they belong to"
on public.clubs for select
using (
  exists (
    select 1
    from public.club_memberships memberships
    where memberships.club_id = clubs.id
      and memberships.user_id = public.current_app_user_id()
  )
);

create policy "users can read own memberships"
on public.club_memberships for select
using (user_id = public.current_app_user_id());

create policy "owners and admins can manage club memberships"
on public.club_memberships for all
using (public.current_user_club_role(club_id) in ('owner', 'admin'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin'));

create policy "authenticated users can read role definitions"
on public.role_definitions for select
to authenticated
using (true);

create policy "club members can read club classes"
on public.club_classes for select
using (public.current_user_club_role(club_id) is not null);

create policy "admins and coaches can manage club classes"
on public.club_classes for all
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "users can read own club strava connection"
on public.strava_connections for select
using (
  user_id = public.current_app_user_id()
  and public.current_user_club_role(club_id) is not null
);

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

create policy "owners can read club billing"
on public.club_billing_subscriptions for select
using (public.current_user_club_role(club_id) = 'owner');

create policy "owners can manage club billing"
on public.club_billing_subscriptions for all
using (public.current_user_club_role(club_id) = 'owner')
with check (public.current_user_club_role(club_id) = 'owner');
