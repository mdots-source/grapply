create or replace function public.member_ids_belong_to_club(target_club_id uuid, member_ids text[])
returns boolean
language sql
stable
as $$
  select not exists (
    select 1
    from unnest(coalesce(member_ids, '{}'::text[])) as requested_member(member_id)
    where not exists (
      select 1
      from public.academy_members member
      where member.club_id = target_club_id
        and member.id = requested_member.member_id
    )
  );
$$;

create or replace function public.member_names_belong_to_club(target_club_id uuid, member_names text[])
returns boolean
language sql
stable
as $$
  select not exists (
    select 1
    from unnest(coalesce(member_names, '{}'::text[])) as requested_member(member_name)
    where not exists (
      select 1
      from public.academy_members member
      where member.club_id = target_club_id
        and member.name = requested_member.member_name
    )
  );
$$;

drop policy if exists "admins and coaches can create competitions" on public.competitions;
drop policy if exists "admins and coaches can update competitions" on public.competitions;

create policy "admins and coaches can create competitions"
on public.competitions for insert
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  and public.member_ids_belong_to_club(club_id, registered_member_ids)
);

create policy "admins and coaches can update competitions"
on public.competitions for update
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  and public.member_ids_belong_to_club(club_id, registered_member_ids)
);

drop policy if exists "admins and coaches can create training camps" on public.training_camps;
drop policy if exists "admins and coaches can update training camps" on public.training_camps;

create policy "admins and coaches can create training camps"
on public.training_camps for insert
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  and public.member_ids_belong_to_club(club_id, registered_member_ids)
);

create policy "admins and coaches can update training camps"
on public.training_camps for update
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  and public.member_ids_belong_to_club(club_id, registered_member_ids)
);

drop policy if exists "admins and coaches can create training posts" on public.training_posts;
drop policy if exists "admins and coaches can update training posts" on public.training_posts;

create policy "admins and coaches can create training posts"
on public.training_posts for insert
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  and public.member_names_belong_to_club(club_id, tagged_students)
);

create policy "admins and coaches can update training posts"
on public.training_posts for update
using (public.current_user_club_role(club_id) in ('owner', 'admin', 'coach'))
with check (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  and public.member_names_belong_to_club(club_id, tagged_students)
);
