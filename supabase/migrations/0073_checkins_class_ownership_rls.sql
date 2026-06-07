create or replace function public.current_user_can_manage_class_attendance(target_club_id uuid, target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_user_club_role(target_club_id) in ('owner', 'admin')
    or exists (
      select 1
      from public.club_classes club_class
      where club_class.id = target_class_id
        and club_class.club_id = target_club_id
        and public.current_user_club_role(target_club_id) = 'coach'
        and (
          club_class.user_id = public.current_app_user_id()
          or (
            club_class.user_id is null
            and public.current_coach_name_matches(club_class.coach)
          )
        )
    );
$$;

drop policy if exists "admins and coaches can create class checkins" on public.class_checkins;
drop policy if exists "owners admins and assigned coach can create class checkins" on public.class_checkins;

create policy "owners admins and assigned coach can create class checkins"
on public.class_checkins for insert
with check (
  public.current_user_can_manage_class_attendance(club_id, class_id)
  and checked_in_by = public.current_app_user_id()
  and exists (
    select 1
    from public.academy_members member
    where member.id = class_checkins.member_id
      and member.club_id = class_checkins.club_id
  )
);

drop policy if exists "owners admins and creating coach can update class checkins" on public.class_checkins;
drop policy if exists "owners admins and assigned creating coach can update class checkins" on public.class_checkins;

create policy "owners admins and assigned creating coach can update class checkins"
on public.class_checkins for update
using (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  or (
    public.current_user_club_role(club_id) = 'coach'
    and checked_in_by = public.current_app_user_id()
    and checked_in_date = current_date
  )
)
with check (
  public.current_user_can_manage_class_attendance(club_id, class_id)
  and (
    public.current_user_club_role(club_id) in ('owner', 'admin')
    or (
      public.current_user_club_role(club_id) = 'coach'
      and checked_in_by = public.current_app_user_id()
      and checked_in_date = current_date
    )
  )
  and exists (
    select 1
    from public.academy_members member
    where member.id = class_checkins.member_id
      and member.club_id = class_checkins.club_id
  )
);
