create or replace function public.prevent_checkin_identity_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.club_id is distinct from old.club_id
    or new.class_id is distinct from old.class_id
    or new.member_id is distinct from old.member_id
    or new.checked_in_by is distinct from old.checked_in_by
    or new.checked_in_date is distinct from old.checked_in_date then
    raise exception 'check-in identity fields cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_checkin_identity_update_on_write on public.class_checkins;
create trigger prevent_checkin_identity_update_on_write
before update of club_id, class_id, member_id, checked_in_by, checked_in_date
on public.class_checkins
for each row
execute function public.prevent_checkin_identity_update();
