drop policy if exists "admins and coaches can manage club classes" on public.club_classes;
drop policy if exists "owners admins coaches can create assigned club classes" on public.club_classes;
drop policy if exists "owners admins coaches can update assigned club classes" on public.club_classes;
drop policy if exists "owners admins coaches can delete assigned club classes" on public.club_classes;

create or replace function public.current_app_user_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select name from public.app_users where id = public.current_app_user_id()
$$;

create or replace function public.current_coach_name_matches(value text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(btrim(coalesce(value, ''))) = lower(btrim(coalesce(public.current_app_user_name(), '')))
$$;

create policy "owners admins coaches can create assigned club classes"
on public.club_classes for insert
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  or (
    public.current_user_club_role(club_id) = 'coach'
    and public.current_coach_name_matches(coach)
  )
);

create policy "owners admins coaches can update assigned club classes"
on public.club_classes for update
using (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  or (
    public.current_user_club_role(club_id) = 'coach'
    and public.current_coach_name_matches(coach)
  )
)
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  or (
    public.current_user_club_role(club_id) = 'coach'
    and public.current_coach_name_matches(coach)
  )
);

create policy "owners admins coaches can delete assigned club classes"
on public.club_classes for delete
using (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  or (
    public.current_user_club_role(club_id) = 'coach'
    and public.current_coach_name_matches(coach)
  )
);
