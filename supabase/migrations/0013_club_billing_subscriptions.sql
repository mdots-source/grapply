create table if not exists public.club_billing_subscriptions (
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

create index if not exists club_billing_subscriptions_club_id_idx
on public.club_billing_subscriptions(club_id);

drop trigger if exists touch_club_billing_subscriptions_updated_at on public.club_billing_subscriptions;
create trigger touch_club_billing_subscriptions_updated_at
before update on public.club_billing_subscriptions
for each row execute function public.touch_updated_at();

alter table public.club_billing_subscriptions enable row level security;

drop policy if exists "owners can read club billing" on public.club_billing_subscriptions;
create policy "owners can read club billing"
on public.club_billing_subscriptions for select
using (public.current_user_club_role(club_id) = 'owner');

drop policy if exists "owners can manage club billing" on public.club_billing_subscriptions;
create policy "owners can manage club billing"
on public.club_billing_subscriptions for all
using (public.current_user_club_role(club_id) = 'owner')
with check (public.current_user_club_role(club_id) = 'owner');
