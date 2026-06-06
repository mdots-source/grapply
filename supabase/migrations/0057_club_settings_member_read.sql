drop policy if exists "owners and admins can read settings" on public.club_settings;
drop policy if exists "club members can read settings" on public.club_settings;

create policy "club members can read settings"
on public.club_settings for select
using (public.current_user_club_role(club_id) is not null);
