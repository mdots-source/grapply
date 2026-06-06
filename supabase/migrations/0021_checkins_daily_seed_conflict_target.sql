alter table public.class_checkins
  drop constraint if exists class_checkins_class_id_member_id_key;

alter table public.class_checkins
  drop constraint if exists class_checkins_class_id_member_id_checked_in_date_key;

create unique index if not exists class_checkins_one_member_per_class_day
on public.class_checkins(class_id, member_id, checked_in_date);
