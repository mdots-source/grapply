drop policy if exists "admins and coaches can update class checkins" on public.class_checkins;
drop policy if exists "owners admins and creating coach can update class checkins" on public.class_checkins;

create policy "owners admins and creating coach can update class checkins"
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
  (
    public.current_user_club_role(club_id) in ('owner', 'admin')
    or (
      public.current_user_club_role(club_id) = 'coach'
      and checked_in_by = public.current_app_user_id()
      and checked_in_date = current_date
    )
  )
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

drop policy if exists "owners and admins can delete coach notes" on public.coach_notes;
drop policy if exists "owners admins and note author can delete coach notes" on public.coach_notes;

create policy "owners admins and note author can delete coach notes"
on public.coach_notes for delete
using (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  or (
    public.current_user_club_role(club_id) = 'coach'
    and coach_user_id = public.current_app_user_id()
  )
);
