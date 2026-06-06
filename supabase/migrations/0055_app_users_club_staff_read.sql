drop policy if exists "owners and admins can read club users" on public.app_users;

create policy "owners and admins can read club users"
on public.app_users for select
using (
  exists (
    select 1
    from public.club_memberships as target_membership
    join public.club_memberships as actor_membership
      on actor_membership.club_id = target_membership.club_id
    where target_membership.user_id = app_users.id
      and actor_membership.user_id = public.current_app_user_id()
      and actor_membership.role in ('owner', 'admin')
  )
);

comment on policy "owners and admins can read club users" on public.app_users is
'Allows club owners and admins to read app user profiles only for users who belong to the same club.';
