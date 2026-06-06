create or replace function public.prevent_manual_class_checked_in_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.class_checkin_count_sync', true) = 'on' then
    return new;
  end if;

  if new.checked_in is distinct from old.checked_in then
    raise exception 'class checked_in is managed by attendance check-ins';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_manual_class_checked_in_update_on_write on public.club_classes;
create trigger prevent_manual_class_checked_in_update_on_write
before update of checked_in
on public.club_classes
for each row
execute function public.prevent_manual_class_checked_in_update();

create or replace function public.refresh_class_checked_in_count(target_club_id uuid, target_class_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.class_checkin_count_sync', 'on', true);

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
end;
$$;
