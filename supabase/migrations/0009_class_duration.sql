alter table public.club_classes
add column if not exists duration_minutes integer not null default 60
check (duration_minutes between 15 and 240);
