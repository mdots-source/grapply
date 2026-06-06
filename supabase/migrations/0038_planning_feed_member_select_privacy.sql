drop policy if exists "club members can read competitions" on public.competitions;
drop policy if exists "club members can read training camps" on public.training_camps;
drop policy if exists "club members can read training posts" on public.training_posts;
drop policy if exists "club staff can read competitions and members can read own registrations" on public.competitions;
drop policy if exists "club staff can read training camps and members can read own registrations" on public.training_camps;
drop policy if exists "club staff can read training posts and members can read own tags" on public.training_posts;

create policy "club staff can read competitions and members can read own registrations"
on public.competitions for select
using (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  or (
    public.current_user_club_role(club_id) = 'member'
    and (
      cardinality(registered_member_ids) = 0
      or exists (
        select 1
        from public.academy_members member
        where member.club_id = competitions.club_id
          and member.user_id = public.current_app_user_id()
          and member.id = any(competitions.registered_member_ids)
      )
    )
  )
);

create policy "club staff can read training camps and members can read own registrations"
on public.training_camps for select
using (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  or (
    public.current_user_club_role(club_id) = 'member'
    and (
      cardinality(registered_member_ids) = 0
      or exists (
        select 1
        from public.academy_members member
        where member.club_id = training_camps.club_id
          and member.user_id = public.current_app_user_id()
          and member.id = any(training_camps.registered_member_ids)
      )
    )
  )
);

create policy "club staff can read training posts and members can read own tags"
on public.training_posts for select
using (
  public.current_user_club_role(club_id) in ('owner', 'admin', 'coach')
  or (
    public.current_user_club_role(club_id) = 'member'
    and (
      cardinality(coalesce(tagged_students, '{}'::text[])) = 0
      or exists (
        select 1
        from public.academy_members member
        where member.club_id = training_posts.club_id
          and member.user_id = public.current_app_user_id()
          and member.name = any(training_posts.tagged_students)
      )
    )
  )
);
