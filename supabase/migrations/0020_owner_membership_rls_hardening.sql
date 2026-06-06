drop policy if exists "owners can manage memberships and admins can manage non-admin memberships" on public.club_memberships;

create policy "owners and admins can manage non-owner memberships"
on public.club_memberships for all
using (
  role <> 'owner'
  and (
    public.current_user_club_role(club_id) = 'owner'
    or (
      public.current_user_club_role(club_id) = 'admin'
      and role in ('coach', 'member')
    )
  )
)
with check (
  role <> 'owner'
  and (
    public.current_user_club_role(club_id) = 'owner'
    or (
      public.current_user_club_role(club_id) = 'admin'
      and role in ('coach', 'member')
    )
  )
);
