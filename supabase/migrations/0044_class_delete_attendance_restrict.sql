alter table public.class_checkins
drop constraint if exists class_checkins_class_id_fkey;

alter table public.class_checkins
add constraint class_checkins_class_id_fkey
foreign key (class_id)
references public.club_classes(id)
on delete restrict;
