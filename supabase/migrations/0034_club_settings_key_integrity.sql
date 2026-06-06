delete from public.club_settings
where key not in ('brand', 'tv', 'coaches', 'appearance', 'integrations');

alter table public.club_settings
drop constraint if exists club_settings_key_valid;

alter table public.club_settings
add constraint club_settings_key_valid
check (key in ('brand', 'tv', 'coaches', 'appearance', 'integrations'));
