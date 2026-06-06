drop policy if exists "owners and admins can read club memberships" on public.club_memberships;
drop policy if exists "owners can read non-owner memberships and admins can read coach member memberships" on public.club_memberships;

create policy "owners can read non-owner memberships and admins can read coach member memberships"
on public.club_memberships for select
using (
  (
    public.current_user_club_role(club_id) = 'owner'
    and role <> 'owner'
  )
  or (
    public.current_user_club_role(club_id) = 'admin'
    and role in ('coach', 'member')
  )
);
