drop policy if exists "staff can read club goals and members can read own" on public.member_goals;

create policy "staff can read club goals and members can read own"
on public.member_goals for select
using (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  or exists (
    select 1
    from public.academy_members member
    where member.id = member_goals.member_id
      and member.club_id = member_goals.club_id
      and member.user_id = public.current_app_user_id()
  )
);
