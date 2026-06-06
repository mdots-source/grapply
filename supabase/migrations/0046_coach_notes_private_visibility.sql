update public.coach_notes
set visibility = 'staff'
where visibility not in ('staff', 'private');

alter table public.coach_notes
drop constraint if exists coach_notes_visibility_valid;

alter table public.coach_notes
add constraint coach_notes_visibility_valid
check (visibility in ('staff', 'private'));

drop policy if exists "admins and coaches can read coach notes" on public.coach_notes;
drop policy if exists "owners admins coaches can read scoped coach notes" on public.coach_notes;

create policy "owners admins coaches can read scoped coach notes"
on public.coach_notes for select
using (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  or (
    public.current_user_club_role(club_id) = 'coach'
    and (
      visibility = 'staff'
      or coach_user_id = public.current_app_user_id()
    )
  )
);
