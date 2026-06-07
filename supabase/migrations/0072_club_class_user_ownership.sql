alter table public.club_classes
add column if not exists user_id uuid references public.app_users(id) on delete set null;

create index if not exists club_classes_user_id_idx
on public.club_classes(user_id);

update public.club_classes as class
set user_id = app_user.id
from public.app_users as app_user
where lower(btrim(class.coach)) = lower(btrim(app_user.name))
  and class.user_id is null
  and exists (
    select 1
    from public.club_memberships membership
    where membership.club_id = class.club_id
      and membership.user_id = app_user.id
      and membership.role in ('owner', 'admin', 'coach')
  );

drop policy if exists "owners admins coaches can create assigned club classes" on public.club_classes;
drop policy if exists "owners admins coaches can update assigned club classes" on public.club_classes;
drop policy if exists "owners admins coaches can delete assigned club classes" on public.club_classes;

create policy "owners admins coaches can create owned club classes"
on public.club_classes for insert
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  or (
    public.current_user_club_role(club_id) = 'coach'
    and user_id = public.current_app_user_id()
    and public.current_coach_name_matches(coach)
  )
);

create policy "owners admins coaches can update owned club classes"
on public.club_classes for update
using (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  or (
    public.current_user_club_role(club_id) = 'coach'
    and (
      user_id = public.current_app_user_id()
      or (user_id is null and public.current_coach_name_matches(coach))
    )
  )
)
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  or (
    public.current_user_club_role(club_id) = 'coach'
    and user_id = public.current_app_user_id()
    and public.current_coach_name_matches(coach)
  )
);

create policy "owners admins coaches can delete owned club classes"
on public.club_classes for delete
using (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  or (
    public.current_user_club_role(club_id) = 'coach'
    and (
      user_id = public.current_app_user_id()
      or (user_id is null and public.current_coach_name_matches(coach))
    )
  )
);
