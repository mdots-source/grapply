drop policy if exists "owners and admins can read club users" on public.app_users;
drop policy if exists "owners can read club users and admins can read coach member users" on public.app_users;

create policy "owners can read club users and admins can read coach member users"
on public.app_users for select
using (
  exists (
    select 1
    from public.club_memberships as target_membership
    join public.club_memberships as actor_membership
      on actor_membership.club_id = target_membership.club_id
    where target_membership.user_id = app_users.id
      and actor_membership.user_id = public.current_app_user_id()
      and (
        actor_membership.role = 'owner'
        or (
          actor_membership.role = 'admin'
          and target_membership.role in ('coach', 'member')
        )
      )
  )
);

comment on policy "owners can read club users and admins can read coach member users" on public.app_users is
'Owners can read users in their clubs. Admins can read only coach/member users in the same club; users still read their own profile through the own-profile policy.';
