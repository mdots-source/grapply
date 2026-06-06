drop policy if exists "admins and coaches can create coach notes" on public.coach_notes;
drop policy if exists "admins and coaches can update coach notes" on public.coach_notes;

create policy "admins and coaches can create coach notes"
on public.coach_notes for insert
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  and coach_user_id = public.current_app_user_id()
  and exists (
    select 1
    from public.academy_members member
    where member.id = coach_notes.member_id
      and member.club_id = coach_notes.club_id
  )
);

create policy "admins and coaches can update coach notes"
on public.coach_notes for update
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  and coach_user_id = public.current_app_user_id()
  and exists (
    select 1
    from public.academy_members member
    where member.id = coach_notes.member_id
      and member.club_id = coach_notes.club_id
  )
);
