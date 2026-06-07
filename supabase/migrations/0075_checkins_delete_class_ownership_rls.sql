drop policy if exists "owners admins and creating coach can delete class checkins" on public.class_checkins;
drop policy if exists "owners admins and assigned creating coach can delete class checkins" on public.class_checkins;

create policy "owners admins and assigned creating coach can delete class checkins"
on public.class_checkins for delete
using (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  or (
    public.current_user_club_role(club_id) = 'coach'
    and checked_in_by = public.current_app_user_id()
    and checked_in_date = current_date
    and public.current_user_can_manage_class_attendance(club_id, class_id)
  )
);
