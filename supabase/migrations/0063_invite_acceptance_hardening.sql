update public.club_invites
set email = lower(trim(email))
where email <> lower(trim(email));

update public.club_invites
set accepted_at = coalesce(accepted_at, created_at)
where status = 'accepted';

alter table public.club_invites
drop constraint if exists club_invites_role_not_owner;

alter table public.club_invites
drop constraint if exists club_invites_role_allowed_for_membership;

alter table public.club_invites
add constraint club_invites_role_allowed_for_membership
check (role in ('admin', 'coach', 'member'));

alter table public.club_invites
drop constraint if exists club_invites_accepted_at_status_consistent;

alter table public.club_invites
add constraint club_invites_accepted_at_status_consistent
check (
  status <> 'accepted'
  or accepted_at is not null
);
