delete from public.club_classes
where lower(trim(day)) not in ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');

update public.club_classes
set day = case lower(trim(day))
  when 'mon' then 'Mon'
  when 'tue' then 'Tue'
  when 'wed' then 'Wed'
  when 'thu' then 'Thu'
  when 'fri' then 'Fri'
  when 'sat' then 'Sat'
  when 'sun' then 'Sun'
  else day
end;

alter table public.club_classes
drop constraint if exists club_classes_day_valid;

alter table public.club_classes
add constraint club_classes_day_valid
check (day in ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'));

update public.club_classes
set checked_in = 0
where checked_in < 0;

alter table public.club_classes
drop constraint if exists club_classes_checked_in_nonnegative;

alter table public.club_classes
add constraint club_classes_checked_in_nonnegative
check (checked_in >= 0);
