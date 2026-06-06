create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  to_email text not null,
  template text not null,
  subject text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  provider_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists email_outbox_club_id_idx on public.email_outbox(club_id);
create index if not exists email_outbox_status_idx on public.email_outbox(status);
create index if not exists email_outbox_created_at_idx on public.email_outbox(created_at desc);

alter table public.email_outbox enable row level security;

drop policy if exists "owners and admins can read club email outbox" on public.email_outbox;
create policy "owners and admins can read club email outbox"
on public.email_outbox for select
using (
  club_id is not null
  and public.current_user_club_role(club_id) in ('owner', 'admin')
);

drop policy if exists "owners and admins can queue club email" on public.email_outbox;
create policy "owners and admins can queue club email"
on public.email_outbox for insert
with check (
  club_id is not null
  and public.current_user_club_role(club_id) in ('owner', 'admin')
);
