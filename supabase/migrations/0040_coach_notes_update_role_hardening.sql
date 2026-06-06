drop policy if exists "admins and coaches can update coach notes" on public.coach_notes;

create policy "owners admins can update coach notes and coaches can update own notes"
on public.coach_notes for update
using (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  or (
    public.current_user_club_role(club_id) = 'coach'
    and coach_user_id = public.current_app_user_id()
  )
)
with check (
  (
    public.current_user_club_role(club_id) in ('owner', 'admin')
    or (
      public.current_user_club_role(club_id) = 'coach'
      and coach_user_id = public.current_app_user_id()
    )
  )
  and exists (
    select 1
    from public.academy_members member
    where member.id = coach_notes.member_id
      and member.club_id = coach_notes.club_id
  )
);
