drop policy if exists "admins and coaches can manage academy members" on public.academy_members;
drop policy if exists "owners and admins can manage academy members" on public.academy_members;
create policy "owners and admins can manage academy members"
on public.academy_members for all
using (public.current_user_club_role(club_id) in ('owner', 'admin'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin'));

drop policy if exists "admins and coaches can manage promotions" on public.member_promotions;
drop policy if exists "owners and admins can manage promotions" on public.member_promotions;
create policy "owners and admins can manage promotions"
on public.member_promotions for all
using (public.current_user_club_role(club_id) in ('owner', 'admin'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin'));

drop policy if exists "admins and coaches can manage coach notes" on public.coach_notes;
drop policy if exists "admins and coaches can create coach notes" on public.coach_notes;
drop policy if exists "admins and coaches can update coach notes" on public.coach_notes;
drop policy if exists "owners and admins can delete coach notes" on public.coach_notes;

create policy "admins and coaches can create coach notes"
on public.coach_notes for insert
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "admins and coaches can update coach notes"
on public.coach_notes for update
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "owners and admins can delete coach notes"
on public.coach_notes for delete
using (public.current_user_club_role(club_id) in ('owner', 'admin'));
