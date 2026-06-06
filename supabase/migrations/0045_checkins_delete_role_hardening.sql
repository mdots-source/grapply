drop policy if exists "admins and coaches can delete class checkins" on public.class_checkins;

create policy "owners admins and creating coach can delete class checkins"
on public.class_checkins for delete
using (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  or (
    public.current_user_club_role(club_id) = 'coach'
    and checked_in_by = public.current_app_user_id()
    and checked_in_date = current_date
  )
);
