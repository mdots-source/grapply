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
