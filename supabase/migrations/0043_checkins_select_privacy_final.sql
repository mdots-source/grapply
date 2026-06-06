drop policy if exists "club members can read class checkins" on public.class_checkins;
drop policy if exists "staff can read club checkins and members can read own" on public.class_checkins;

create policy "staff can read club checkins and members can read own"
on public.class_checkins for select
using (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  or exists (
    select 1
    from public.academy_members member
    where member.id = class_checkins.member_id
      and member.club_id = class_checkins.club_id
      and member.user_id = public.current_app_user_id()
  )
);
