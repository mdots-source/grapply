drop policy if exists "club members can read competitions" on public.competitions;
drop policy if exists "club members can read training camps" on public.training_camps;
drop policy if exists "club members can read training posts" on public.training_posts;
drop policy if exists "club staff can read competitions and members can read own registrations" on public.competitions;
drop policy if exists "club staff can read training camps and members can read own registrations" on public.training_camps;
drop policy if exists "club staff can read training posts and members can read own tags" on public.training_posts;

create policy "club staff can read competitions and members can read own registrations"
on public.competitions for select
using (
  current_user_club_role(club_id) = any(array['owner'::public.platform_role, 'admin'::public.platform_role, 'coach'::public.platform_role])
  or (
    current_user_club_role(club_id) = 'member'::public.platform_role
    and exists (
      select 1
      from public.academy_members member
      where member.club_id = competitions.club_id
        and member.user_id = public.current_app_user_id()
        and member.id = any(competitions.registered_member_ids)
    )
  )
);

create policy "club staff can read training camps and members can read own registrations"
on public.training_camps for select
using (
  current_user_club_role(club_id) = any(array['owner'::public.platform_role, 'admin'::public.platform_role, 'coach'::public.platform_role])
  or (
    current_user_club_role(club_id) = 'member'::public.platform_role
    and exists (
      select 1
      from public.academy_members member
      where member.club_id = training_camps.club_id
        and member.user_id = public.current_app_user_id()
        and member.id = any(training_camps.registered_member_ids)
    )
  )
);

create policy "club staff can read training posts and members can read own tags"
on public.training_posts for select
using (
  current_user_club_role(club_id) = any(array['owner'::public.platform_role, 'admin'::public.platform_role, 'coach'::public.platform_role])
  or (
    current_user_club_role(club_id) = 'member'::public.platform_role
    and exists (
      select 1
      from public.academy_members member
      where member.club_id = training_posts.club_id
        and member.user_id = public.current_app_user_id()
        and member.name = any(training_posts.tagged_students)
    )
  )
);

drop policy if exists "owners and admins can read settings" on public.club_settings;
drop policy if exists "club members can read settings" on public.club_settings;

create policy "club members can read settings"
on public.club_settings for select
using (current_user_club_role(club_id) is not null);
