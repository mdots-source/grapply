with duplicate_names as (
  select
    id,
    row_number() over (
      partition by club_id, lower(trim(name))
      order by created_at, id
    ) as duplicate_number
  from public.academy_members
)
update public.academy_members as member
set name = left(member.name, 145) || ' (' || right(member.id, 8) || ')'
from duplicate_names
where duplicate_names.id = member.id
  and duplicate_names.duplicate_number > 1;

update public.academy_members
set
  stripes = least(greatest(stripes, 0), 4),
  total_hours = greatest(total_hours, 0),
  classes_30 = greatest(classes_30, 0),
  streak = greatest(streak, 0),
  points = greatest(points, 0),
  wins = greatest(wins, 0),
  losses = greatest(losses, 0);

alter table public.academy_members
drop constraint if exists academy_members_stripes_valid;

alter table public.academy_members
add constraint academy_members_stripes_valid
check (stripes between 0 and 4);

alter table public.academy_members
drop constraint if exists academy_members_metrics_nonnegative;

alter table public.academy_members
add constraint academy_members_metrics_nonnegative
check (
  total_hours >= 0
  and classes_30 >= 0
  and streak >= 0
  and points >= 0
  and wins >= 0
  and losses >= 0
);

create unique index if not exists academy_members_club_lower_name_key
on public.academy_members(club_id, lower(trim(name)));
