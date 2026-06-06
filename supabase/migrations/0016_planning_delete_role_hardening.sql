drop policy if exists "admins and coaches can manage competitions" on public.competitions;
drop policy if exists "admins and coaches can create competitions" on public.competitions;
drop policy if exists "admins and coaches can update competitions" on public.competitions;
drop policy if exists "owners and admins can delete competitions" on public.competitions;

create policy "admins and coaches can create competitions"
on public.competitions for insert
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "admins and coaches can update competitions"
on public.competitions for update
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "owners and admins can delete competitions"
on public.competitions for delete
using (public.current_user_club_role(club_id) in ('owner', 'admin'));

drop policy if exists "admins and coaches can manage training camps" on public.training_camps;
drop policy if exists "admins and coaches can create training camps" on public.training_camps;
drop policy if exists "admins and coaches can update training camps" on public.training_camps;
drop policy if exists "owners and admins can delete training camps" on public.training_camps;

create policy "admins and coaches can create training camps"
on public.training_camps for insert
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "admins and coaches can update training camps"
on public.training_camps for update
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "owners and admins can delete training camps"
on public.training_camps for delete
using (public.current_user_club_role(club_id) in ('owner', 'admin'));

drop policy if exists "admins and coaches can manage training posts" on public.training_posts;
drop policy if exists "admins and coaches can create training posts" on public.training_posts;
drop policy if exists "admins and coaches can update training posts" on public.training_posts;
drop policy if exists "owners and admins can delete training posts" on public.training_posts;

create policy "admins and coaches can create training posts"
on public.training_posts for insert
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "admins and coaches can update training posts"
on public.training_posts for update
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'));

create policy "owners and admins can delete training posts"
on public.training_posts for delete
using (public.current_user_club_role(club_id) in ('owner', 'admin'));
