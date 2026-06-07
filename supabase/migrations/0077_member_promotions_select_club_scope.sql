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
      and member.club_id = member_promotions.club_id
      and member.user_id = public.current_app_user_id()
  )
);
