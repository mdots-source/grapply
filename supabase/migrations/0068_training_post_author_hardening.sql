alter table public.training_posts
add column if not exists coach_user_id uuid references public.app_users(id) on delete set null;

create index if not exists training_posts_coach_user_id_idx
on public.training_posts(coach_user_id);

update public.training_posts as post
set coach_user_id = app_user.id
from public.app_users as app_user
join public.club_memberships as membership
  on membership.user_id = app_user.id
where post.club_id = membership.club_id
  and post.coach_user_id is null
  and lower(post.coach) = lower(app_user.name);

drop policy if exists "admins and coaches can create training posts" on public.training_posts;
drop policy if exists "admins and coaches can update training posts" on public.training_posts;
drop policy if exists "owners and admins can delete training posts" on public.training_posts;
drop policy if exists "owners admins coaches can delete scoped training posts" on public.training_posts;

create policy "owners admins coaches can create authored training posts"
on public.training_posts for insert
with check (
  public.member_names_belong_to_club(club_id, tagged_students)
  and (
    public.current_user_club_role(club_id) in ('owner', 'admin')
    or (
      public.current_user_club_role(club_id) = 'coach'
      and coach_user_id = public.current_app_user_id()
    )
  )
);

create policy "owners admins coaches can update scoped training posts"
on public.training_posts for update
using (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  or (
    public.current_user_club_role(club_id) = 'coach'
    and coach_user_id = public.current_app_user_id()
  )
)
with check (
  public.member_names_belong_to_club(club_id, tagged_students)
  and (
    public.current_user_club_role(club_id) in ('owner', 'admin')
    or (
      public.current_user_club_role(club_id) = 'coach'
      and coach_user_id = public.current_app_user_id()
    )
  )
);

create policy "owners admins coaches can delete scoped training posts"
on public.training_posts for delete
using (
  public.current_user_club_role(club_id) in ('owner', 'admin')
  or (
    public.current_user_club_role(club_id) = 'coach'
    and coach_user_id = public.current_app_user_id()
  )
);
