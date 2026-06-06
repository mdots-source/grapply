drop policy if exists "admins and coaches can manage goals" on public.member_goals;
drop policy if exists "admins and coaches can create goals" on public.member_goals;
drop policy if exists "admins and coaches can update goals" on public.member_goals;
drop policy if exists "owners and admins can delete goals" on public.member_goals;

create policy "admins and coaches can create goals"
on public.member_goals for insert
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "admins and coaches can update goals"
on public.member_goals for update
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "owners and admins can delete goals"
on public.member_goals for delete
using (public.current_user_club_role(club_id) in ('owner', 'admin'));
