update public.competitions as competition
set registered_member_ids = coalesce((
  select array_agg(member_id order by first_seen)
  from (
    select reference.member_id, min(reference.ordinality) as first_seen
    from unnest(competition.registered_member_ids) with ordinality as reference(member_id, ordinality)
    where exists (
      select 1
      from public.academy_members as member
      where member.club_id = competition.club_id
        and member.id = reference.member_id
    )
    group by reference.member_id
  ) as valid_members
), '{}'::text[]);

update public.training_camps as camp
set registered_member_ids = coalesce((
  select array_agg(member_id order by first_seen)
  from (
    select reference.member_id, min(reference.ordinality) as first_seen
    from unnest(camp.registered_member_ids) with ordinality as reference(member_id, ordinality)
    where exists (
      select 1
      from public.academy_members as member
      where member.club_id = camp.club_id
        and member.id = reference.member_id
    )
    group by reference.member_id
  ) as valid_members
), '{}'::text[]);

update public.training_posts as post
set tagged_students = nullif(coalesce((
  select array_agg(member_name order by first_seen)
  from (
    select reference.member_name, min(reference.ordinality) as first_seen
    from unnest(coalesce(post.tagged_students, '{}'::text[])) with ordinality as reference(member_name, ordinality)
    where exists (
      select 1
      from public.academy_members as member
      where member.club_id = post.club_id
        and member.name = reference.member_name
    )
    group by reference.member_name
  ) as valid_members
), '{}'::text[]), '{}'::text[]);

update public.training_posts as post
set top_participant = null
where top_participant ? 'name'
  and not exists (
    select 1
    from public.academy_members as member
    where member.club_id = post.club_id
      and member.name = post.top_participant ->> 'name'
  );

create or replace function public.validate_planning_registered_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  unique_member_ids text[];
  invalid_count integer;
begin
  new.registered_member_ids := coalesce(new.registered_member_ids, '{}'::text[]);

  select coalesce(array_agg(member_id order by first_seen), '{}'::text[])
  into unique_member_ids
  from (
    select reference.member_id, min(reference.ordinality) as first_seen
    from unnest(new.registered_member_ids) with ordinality as reference(member_id, ordinality)
    where length(trim(reference.member_id)) > 0
    group by reference.member_id
  ) as unique_members;

  if cardinality(unique_member_ids) <> cardinality(new.registered_member_ids) then
    raise exception 'registered_member_ids must be unique and non-empty';
  end if;

  select count(*)
  into invalid_count
  from unnest(new.registered_member_ids) as reference(member_id)
  where not exists (
    select 1
    from public.academy_members as member
    where member.club_id = new.club_id
      and member.id = reference.member_id
  );

  if invalid_count > 0 then
    raise exception 'registered_member_ids must belong to the same club';
  end if;

  return new;
end;
$$;

create or replace function public.validate_training_post_member_refs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  unique_names text[];
  invalid_count integer;
  participant_name text;
begin
  new.tagged_students := coalesce(new.tagged_students, '{}'::text[]);

  select coalesce(array_agg(member_name order by first_seen), '{}'::text[])
  into unique_names
  from (
    select reference.member_name, min(reference.ordinality) as first_seen
    from unnest(new.tagged_students) with ordinality as reference(member_name, ordinality)
    where length(trim(reference.member_name)) > 0
    group by reference.member_name
  ) as unique_members;

  if cardinality(unique_names) <> cardinality(new.tagged_students) then
    raise exception 'tagged_students must be unique and non-empty';
  end if;

  select count(*)
  into invalid_count
  from unnest(new.tagged_students) as reference(member_name)
  where not exists (
    select 1
    from public.academy_members as member
    where member.club_id = new.club_id
      and member.name = reference.member_name
  );

  if invalid_count > 0 then
    raise exception 'tagged_students must belong to the same club';
  end if;

  participant_name := nullif(trim(coalesce(new.top_participant ->> 'name', '')), '');
  if participant_name is not null and not exists (
    select 1
    from public.academy_members as member
    where member.club_id = new.club_id
      and member.name = participant_name
  ) then
    raise exception 'top_participant must belong to the same club';
  end if;

  new.tagged_students := nullif(new.tagged_students, '{}'::text[]);
  return new;
end;
$$;

drop trigger if exists validate_competition_registered_members_on_write on public.competitions;
create trigger validate_competition_registered_members_on_write
before insert or update of club_id, registered_member_ids
on public.competitions
for each row
execute function public.validate_planning_registered_members();

drop trigger if exists validate_training_camp_registered_members_on_write on public.training_camps;
create trigger validate_training_camp_registered_members_on_write
before insert or update of club_id, registered_member_ids
on public.training_camps
for each row
execute function public.validate_planning_registered_members();

drop trigger if exists validate_training_post_member_refs_on_write on public.training_posts;
create trigger validate_training_post_member_refs_on_write
before insert or update of club_id, tagged_students, top_participant
on public.training_posts
for each row
execute function public.validate_training_post_member_refs();
