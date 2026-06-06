drop policy if exists "admins and coaches can create class checkins" on public.class_checkins;
drop policy if exists "admins and coaches can update class checkins" on public.class_checkins;
drop policy if exists "admins and coaches can delete class checkins" on public.class_checkins;

create policy "admins and coaches can create class checkins"
on public.class_checkins for insert
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  and checked_in_by = public.current_app_user_id()
  and exists (
    select 1
    from public.club_classes club_class
    where club_class.id = class_checkins.class_id
      and club_class.club_id = class_checkins.club_id
  )
  and exists (
    select 1
    from public.academy_members member
    where member.id = class_checkins.member_id
      and member.club_id = class_checkins.club_id
  )
);

create policy "admins and coaches can update class checkins"
on public.class_checkins for update
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  and checked_in_by = public.current_app_user_id()
  and exists (
    select 1
    from public.club_classes club_class
    where club_class.id = class_checkins.class_id
      and club_class.club_id = class_checkins.club_id
  )
  and exists (
    select 1
    from public.academy_members member
    where member.id = class_checkins.member_id
      and member.club_id = class_checkins.club_id
  )
);

create policy "admins and coaches can delete class checkins"
on public.class_checkins for delete
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));
