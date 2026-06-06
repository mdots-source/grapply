create or replace function public.prevent_coach_goal_member_reassignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.member_id is distinct from new.member_id
    and public.current_user_club_role(old.club_id) = 'coach'
  then
    raise exception 'coaches cannot move goals between members';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_coach_goal_member_reassignment_on_write on public.member_goals;
create trigger prevent_coach_goal_member_reassignment_on_write
before update of member_id
on public.member_goals
for each row
execute function public.prevent_coach_goal_member_reassignment();
