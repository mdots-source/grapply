create or replace function public.refresh_class_checked_in_count(target_club_id uuid, target_class_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.club_classes as class
  set checked_in = (
    select count(*)::integer
    from public.class_checkins as checkin
    where checkin.club_id = target_club_id
      and checkin.class_id = target_class_id
      and checkin.checked_in_date = current_date
  )
  where class.club_id = target_club_id
    and class.id = target_class_id;
$$;

create or replace function public.sync_class_checked_in_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_class_checked_in_count(old.club_id, old.class_id);
    return old;
  end if;

  if tg_op = 'UPDATE'
    and (old.club_id is distinct from new.club_id or old.class_id is distinct from new.class_id or old.checked_in_date is distinct from new.checked_in_date)
  then
    perform public.refresh_class_checked_in_count(old.club_id, old.class_id);
  end if;

  perform public.refresh_class_checked_in_count(new.club_id, new.class_id);
  return new;
end;
$$;

drop trigger if exists sync_class_checked_in_count_on_checkins on public.class_checkins;
create trigger sync_class_checked_in_count_on_checkins
after insert or update of club_id, class_id, checked_in_date or delete
on public.class_checkins
for each row
execute function public.sync_class_checked_in_count();

update public.club_classes as class
set checked_in = (
  select count(*)::integer
  from public.class_checkins as checkin
  where checkin.club_id = class.club_id
    and checkin.class_id = class.id
    and checkin.checked_in_date = current_date
);
