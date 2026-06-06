create or replace function public.prevent_coach_note_identity_update()
returns trigger
language plpgsql
as $$
begin
  if new.club_id <> old.club_id
    or new.member_id <> old.member_id
    or new.coach_user_id is distinct from old.coach_user_id
    or new.coach_name <> old.coach_name then
    raise exception 'coach note identity fields cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_coach_note_identity_update_on_write on public.coach_notes;
create trigger prevent_coach_note_identity_update_on_write
before update of club_id, member_id, coach_user_id, coach_name
on public.coach_notes
for each row
execute function public.prevent_coach_note_identity_update();
