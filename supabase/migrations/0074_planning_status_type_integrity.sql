alter table public.competitions
drop constraint if exists competitions_status_valid;

alter table public.competitions
add constraint competitions_status_valid
check (status in ('Registration open', 'Planning', 'Invite list', 'Waitlist', 'Closed', 'Completed', 'Cancelled'));

alter table public.competitions
drop constraint if exists competitions_type_valid;

alter table public.competitions
add constraint competitions_type_valid
check (type in ('Gi', 'No-Gi', 'Gi / No-Gi'));

alter table public.training_camps
drop constraint if exists training_camps_status_valid;

alter table public.training_camps
add constraint training_camps_status_valid
check (status in ('Registration open', 'Planning', 'Early bird', 'Waitlist', 'Closed', 'Completed', 'Cancelled'));

alter table public.training_camps
drop constraint if exists training_camps_type_valid;

alter table public.training_camps
add constraint training_camps_type_valid
check (type in ('Gi', 'No-Gi', 'Gi / No-Gi'));
