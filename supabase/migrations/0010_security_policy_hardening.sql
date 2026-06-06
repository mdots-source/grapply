drop policy if exists "club members can read academy members" on public.academy_members;
create policy "staff can read club members and members can read own profile"
on public.academy_members for select
using (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  or user_id = public.current_app_user_id()
);

drop policy if exists "club members can read settings" on public.club_settings;
drop policy if exists "owners and admins can read settings" on public.club_settings;
create policy "owners and admins can read settings"
on public.club_settings for select
using (public.current_user_club_role(club_id) in ('owner', 'admin'));

drop policy if exists "club members can read dashboard events" on public.dashboard_events;
drop policy if exists "staff can read dashboard events" on public.dashboard_events;
create policy "staff can read dashboard events"
on public.dashboard_events for select
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

drop policy if exists "club members can read promotions" on public.member_promotions;
drop policy if exists "staff can read club promotions and members can read own" on public.member_promotions;
create policy "staff can read club promotions and members can read own"
on public.member_promotions for select
using (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  or exists (
    select 1
    from public.academy_members member
    where member.id = member_promotions.member_id
      and member.user_id = public.current_app_user_id()
  )
);

drop policy if exists "owners and admins can manage invites" on public.club_invites;
create policy "owners can manage all invites and admins can manage non-admin invites"
on public.club_invites for all
using (
  public.current_user_club_role(club_id) = 'owner'
  or (
    public.current_user_club_role(club_id) = 'admin'
    and role in ('coach', 'member')
  )
)
with check (
  public.current_user_club_role(club_id) = 'owner'
  or (
    public.current_user_club_role(club_id) = 'admin'
    and role in ('coach', 'member')
  )
);

drop policy if exists "owners and admins can manage club memberships" on public.club_memberships;
drop policy if exists "owners and admins can read club memberships" on public.club_memberships;
create policy "owners and admins can read club memberships"
on public.club_memberships for select
using (public.current_user_club_role(club_id) in ('owner', 'admin'));

create policy "owners can manage memberships and admins can manage non-admin memberships"
on public.club_memberships for all
using (
  public.current_user_club_role(club_id) = 'owner'
  or (
    public.current_user_club_role(club_id) = 'admin'
    and role in ('coach', 'member')
  )
)
with check (
  public.current_user_club_role(club_id) = 'owner'
  or (
    public.current_user_club_role(club_id) = 'admin'
    and role in ('coach', 'member')
  )
);
