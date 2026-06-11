drop policy if exists "owners and admins can create promotions" on public.member_promotions;
drop policy if exists "staff can create non-belt promotions and admins can create belts" on public.member_promotions;

create policy "staff can create non-belt promotions and admins can create belts"
on public.member_promotions for insert
with check (
  (
    public.current_user_club_role(club_id) in ('owner', 'admin')
    or (
      public.current_user_club_role(club_id) = 'coach'
      and type in ('stripe', 'ranking', 'achievement')
    )
  )
  and awarded_by = public.current_app_user_id()
  and exists (
    select 1
    from public.academy_members member
    where member.id = member_promotions.member_id
      and member.club_id = member_promotions.club_id
  )
);
