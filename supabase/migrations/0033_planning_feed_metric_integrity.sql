update public.competitions
set prep = least(greatest(prep, 0), 100);

alter table public.competitions
drop constraint if exists competitions_prep_valid;

alter table public.competitions
add constraint competitions_prep_valid
check (prep between 0 and 100);

update public.training_camps
set
  prep = least(greatest(prep, 0), 100),
  spots_total = greatest(spots_total, greatest(cardinality(registered_member_ids), 1));

alter table public.training_camps
drop constraint if exists training_camps_prep_valid;

alter table public.training_camps
add constraint training_camps_prep_valid
check (prep between 0 and 100);

alter table public.training_camps
drop constraint if exists training_camps_spots_total_valid;

alter table public.training_camps
add constraint training_camps_spots_total_valid
check (spots_total >= 1 and cardinality(registered_member_ids) <= spots_total);

update public.training_posts
set
  attendance = greatest(coalesce(attendance, 0), 0),
  reactions = greatest(reactions, 0),
  comments = greatest(comments, 0),
  heat = greatest(heat, 0);

alter table public.training_posts
drop constraint if exists training_posts_metrics_nonnegative;

alter table public.training_posts
add constraint training_posts_metrics_nonnegative
check (
  (attendance is null or attendance >= 0)
  and reactions >= 0
  and comments >= 0
  and heat >= 0
);

alter table public.training_posts
drop constraint if exists training_posts_type_valid;

alter table public.training_posts
add constraint training_posts_type_valid
check (type in ('session', 'promotion', 'competition', 'announcement', 'milestone', 'open-mat'));
