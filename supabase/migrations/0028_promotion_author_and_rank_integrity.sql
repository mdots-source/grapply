drop policy if exists "owners and admins can manage promotions" on public.member_promotions;
drop policy if exists "owners and admins can create promotions" on public.member_promotions;
drop policy if exists "owners and admins can delete promotions" on public.member_promotions;

create policy "owners and admins can create promotions"
on public.member_promotions for insert
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  and awarded_by = public.current_app_user_id()
  and exists (
    select 1
    from public.academy_members member
    where member.id = member_promotions.member_id
      and member.club_id = member_promotions.club_id
  )
);

create policy "owners and admins can delete promotions"
on public.member_promotions for delete
using (public.current_user_club_role(club_id) in ('owner', 'admin'));
