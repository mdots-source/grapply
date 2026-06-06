create or replace function public.club_class_time_to_minutes(class_time text)
returns integer
language plpgsql
immutable
as $$
declare
  normalized text := trim(class_time);
begin
  if normalized !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'Class time must use 24-hour HH:MM format.'
      using errcode = '22023';
  end if;

  return split_part(normalized, ':', 1)::integer * 60 + split_part(normalized, ':', 2)::integer;
end;
$$;

create or replace function public.prevent_overlapping_club_classes()
returns trigger
language plpgsql
as $$
declare
  candidate_start integer;
  candidate_end integer;
  conflicting_class public.club_classes%rowtype;
begin
  candidate_start := public.club_class_time_to_minutes(new.time);
  candidate_end := candidate_start + coalesce(new.duration_minutes, 60);

  if candidate_end > 24 * 60 then
    raise exception 'Class duration cannot run past the end of the day.'
      using errcode = '22023';
  end if;

  select existing.*
  into conflicting_class
  from public.club_classes existing
  where existing.club_id = new.club_id
    and existing.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    and lower(trim(existing.day)) = lower(trim(new.day))
    and lower(trim(existing.mat)) = lower(trim(new.mat))
    and public.club_class_time_to_minutes(existing.time) < candidate_end
    and candidate_start < public.club_class_time_to_minutes(existing.time) + coalesce(existing.duration_minutes, 60)
  limit 1;

  if found then
    raise exception 'Class overlaps with existing class "%" on % at % (%).',
      conflicting_class.name,
      conflicting_class.day,
      conflicting_class.time,
      conflicting_class.mat
      using errcode = '23505';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_overlapping_club_classes on public.club_classes;
create trigger prevent_overlapping_club_classes
before insert or update of club_id, day, time, mat, duration_minutes
on public.club_classes
for each row
execute function public.prevent_overlapping_club_classes();
