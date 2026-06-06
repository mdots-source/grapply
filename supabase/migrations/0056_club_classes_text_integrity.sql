delete from public.club_classes
where btrim(name) = ''
   or btrim(coach) = ''
   or btrim(mat) = ''
   or btrim(level) = '';

update public.club_classes
set name = btrim(name),
    coach = btrim(coach),
    mat = btrim(mat),
    level = btrim(level),
    time = btrim(time);

alter table public.club_classes
drop constraint if exists club_classes_text_nonempty;

alter table public.club_classes
add constraint club_classes_text_nonempty
check (
  btrim(name) <> ''
  and btrim(coach) <> ''
  and btrim(mat) <> ''
  and btrim(level) <> ''
);

alter table public.club_classes
drop constraint if exists club_classes_time_valid;

alter table public.club_classes
add constraint club_classes_time_valid
check (time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
