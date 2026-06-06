alter table public.member_promotions
add column if not exists previous_belt public.bjj_belt,
add column if not exists previous_stripes integer check (previous_stripes is null or previous_stripes between 0 and 4);
