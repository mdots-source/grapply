update public.member_goals
set status = 'active'
where status not in ('active', 'completed', 'paused', 'archived');

update public.member_goals
set completed_at = coalesce(completed_at, now())
where status = 'completed'
  and completed_at is null;

update public.member_goals
set completed_at = null
where status <> 'completed'
  and completed_at is not null;

alter table public.member_goals
drop constraint if exists member_goals_status_valid;

alter table public.member_goals
add constraint member_goals_status_valid
check (status in ('active', 'completed', 'paused', 'archived'));

alter table public.member_goals
drop constraint if exists member_goals_completed_at_matches_status;

alter table public.member_goals
add constraint member_goals_completed_at_matches_status
check (
  (status = 'completed' and completed_at is not null)
  or (status <> 'completed' and completed_at is null)
);
