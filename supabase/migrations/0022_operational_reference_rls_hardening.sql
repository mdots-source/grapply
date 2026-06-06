drop policy if exists "admins and coaches can manage class checkins" on public.class_checkins;
drop policy if exists "admins and coaches can create class checkins" on public.class_checkins;
drop policy if exists "admins and coaches can update class checkins" on public.class_checkins;
drop policy if exists "admins and coaches can delete class checkins" on public.class_checkins;

create policy "admins and coaches can create class checkins"
on public.class_checkins for insert
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
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

create policy "admins and coaches can update class checkins"
on public.class_checkins for update
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
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

create policy "admins and coaches can delete class checkins"
on public.class_checkins for delete
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

drop policy if exists "admins and coaches can create coach notes" on public.coach_notes;
drop policy if exists "admins and coaches can update coach notes" on public.coach_notes;

create policy "admins and coaches can create coach notes"
on public.coach_notes for insert
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
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
  and exists (
    select 1
    from public.academy_members member
    where member.id = coach_notes.member_id
      and member.club_id = coach_notes.club_id
  )
);

drop policy if exists "owners and admins can manage promotions" on public.member_promotions;

create policy "owners and admins can manage promotions"
on public.member_promotions for all
using (public.current_user_club_role(club_id) in ('owner', 'admin'))
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  and exists (
    select 1
    from public.academy_members member
    where member.id = member_promotions.member_id
      and member.club_id = member_promotions.club_id
  )
);

drop policy if exists "admins and coaches can create goals" on public.member_goals;
drop policy if exists "admins and coaches can update goals" on public.member_goals;

create policy "admins and coaches can create goals"
on public.member_goals for insert
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  and exists (
    select 1
    from public.academy_members member
    where member.id = member_goals.member_id
      and member.club_id = member_goals.club_id
  )
);

create policy "admins and coaches can update goals"
on public.member_goals for update
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  and exists (
    select 1
    from public.academy_members member
    where member.id = member_goals.member_id
      and member.club_id = member_goals.club_id
  )
);
