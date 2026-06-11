drop policy if exists "owners can read non-owner memberships and admins can read coach member memberships" on public.club_memberships;
drop policy if exists "owners can read all memberships and admins can read coach member memberships" on public.club_memberships;

create policy "owners can read all memberships and admins can read coach member memberships"
on public.club_memberships for select
using (
  public.current_user_club_role(club_id) = 'owner'
  or (
    public.current_user_club_role(club_id) = 'admin'
    and role in ('coach', 'member')
  )
);

comment on policy "owners can read all memberships and admins can read coach member memberships" on public.club_memberships is
'Owners can see the full club membership roster, including other owners, while management policies still prevent owner-role changes. Admins can only see coach/member memberships.';
