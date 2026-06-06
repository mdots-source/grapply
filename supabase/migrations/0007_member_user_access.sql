alter table public.academy_members
  add column if not exists user_id uuid references public.app_users(id) on delete set null;

create index if not exists academy_members_user_id_idx on public.academy_members(user_id);

update public.academy_members set user_id = '00000000-0000-0000-0000-000000000101' where id = 'st-003';
update public.academy_members set user_id = '00000000-0000-0000-0000-000000000102' where id = 'st-001';
update public.academy_members set user_id = '00000000-0000-0000-0000-000000000103' where id = 'st-004';
update public.academy_members set user_id = '00000000-0000-0000-0000-000000000105' where id = 'st-005';
update public.academy_members set user_id = '00000000-0000-0000-0000-000000000106' where id = 'st-010';
update public.academy_members set user_id = '00000000-0000-0000-0000-000000000107' where id = 'st-011';
update public.academy_members set user_id = '00000000-0000-0000-0000-000000000108' where id = 'st-012';
update public.academy_members set user_id = '00000000-0000-0000-0000-000000000109' where id = 'st-013';
update public.academy_members set user_id = '00000000-0000-0000-0000-000000000110' where id = 'st-014';

drop policy if exists "club members can read class checkins" on public.class_checkins;
create policy "staff can read club checkins and members can read own"
on public.class_checkins for select
using (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  or exists (
    select 1
    from public.academy_members member
    where member.id = class_checkins.member_id
      and member.user_id = public.current_app_user_id()
  )
);

drop policy if exists "club members can read own goals" on public.member_goals;
create policy "staff can read club goals and members can read own"
on public.member_goals for select
using (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  or exists (
    select 1
    from public.academy_members member
    where member.id = member_goals.member_id
      and member.user_id = public.current_app_user_id()
  )
);
