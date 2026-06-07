drop policy if exists "staff can read club members and members can read own profile" on public.academy_members;

create policy "staff can read club members and members can read own profile"
on public.academy_members for select
using (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  or (
    public.current_user_club_role(club_id) = 'member'
    and user_id = public.current_app_user_id()
  )
);
