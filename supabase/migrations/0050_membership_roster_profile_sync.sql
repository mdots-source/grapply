with ranked_profiles as (
  select
    id,
    row_number() over (partition by club_id, user_id order by created_at desc, id desc) as row_number
  from public.academy_members
  where user_id is not null
)
update public.academy_members as member
set user_id = null,
    status = 'inactive'
from ranked_profiles
where member.id = ranked_profiles.id
  and ranked_profiles.row_number > 1;

create unique index if not exists academy_members_club_user_unique
on public.academy_members(club_id, user_id)
where user_id is not null;

insert into public.academy_members (
  id,
  club_id,
  user_id,
  name,
  belt,
  stripes,
  role,
  status,
  total_hours,
  classes_30,
  streak,
  points,
  wins,
  losses,
  last_seen,
  focus,
  avatar_url,
  profile
)
select
  lower('usr-' || left(replace(membership.club_id::text, '-', ''), 8) || '-' || left(replace(membership.user_id::text, '-', ''), 8)),
  membership.club_id,
  membership.user_id,
  app_user.name,
  coalesce(app_user.belt, 'white')::public.bjj_belt,
  least(greatest(coalesce(app_user.stripes, 0), 0), 4),
  case when membership.role = 'member' then 'member'::public.member_role else 'coach'::public.member_role end,
  'active'::public.member_status,
  0,
  0,
  0,
  0,
  0,
  0,
  'New member',
  case when membership.role = 'member' then 'Onboarding' else 'Academy operations' end,
  app_user.avatar_url,
  jsonb_build_object(
    'roleLabel',
    case
      when membership.role = 'owner' then 'Owner'
      when membership.role = 'admin' then 'Admin'
      when membership.role = 'coach' then 'Coach'
      else 'Member'
    end,
    'source',
    'membership_sync',
    'email',
    app_user.email
  )
from public.club_memberships as membership
join public.app_users as app_user on app_user.id = membership.user_id
left join public.academy_members as existing_profile
  on existing_profile.club_id = membership.club_id
  and existing_profile.user_id = membership.user_id
where existing_profile.id is null
on conflict (id) do nothing;

update public.academy_members as member
set role = case when membership.role = 'member' then 'member'::public.member_role else 'coach'::public.member_role end,
    status = 'active'
from public.club_memberships as membership
where member.club_id = membership.club_id
  and member.user_id = membership.user_id;

create or replace function public.sync_membership_roster_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  app_user public.app_users%rowtype;
  roster_role public.member_role;
  existing_profile_id text;
begin
  select *
  into app_user
  from public.app_users
  where id = new.user_id;

  if app_user.id is null then
    return new;
  end if;

  roster_role := case when new.role = 'member' then 'member'::public.member_role else 'coach'::public.member_role end;

  select id
  into existing_profile_id
  from public.academy_members
  where club_id = new.club_id
    and user_id = new.user_id
  limit 1;

  if existing_profile_id is not null then
    update public.academy_members
    set name = app_user.name,
        belt = coalesce(app_user.belt, belt),
        stripes = least(greatest(coalesce(app_user.stripes, stripes), 0), 4),
        role = roster_role,
        status = 'active',
        avatar_url = app_user.avatar_url
    where id = existing_profile_id;
  else
    insert into public.academy_members (
      id,
      club_id,
      user_id,
      name,
      belt,
      stripes,
      role,
      status,
      total_hours,
      classes_30,
      streak,
      points,
      wins,
      losses,
      last_seen,
      focus,
      avatar_url,
      profile
    )
    values (
      lower('usr-' || left(replace(new.club_id::text, '-', ''), 8) || '-' || left(replace(new.user_id::text, '-', ''), 8)),
      new.club_id,
      new.user_id,
      app_user.name,
      coalesce(app_user.belt, 'white')::public.bjj_belt,
      least(greatest(coalesce(app_user.stripes, 0), 0), 4),
      roster_role,
      'active'::public.member_status,
      0,
      0,
      0,
      0,
      0,
      0,
      'New member',
      case when new.role = 'member' then 'Onboarding' else 'Academy operations' end,
      app_user.avatar_url,
      jsonb_build_object('roleLabel', initcap(new.role::text), 'source', 'membership_sync', 'email', app_user.email)
    )
    on conflict (id) do update
    set user_id = excluded.user_id,
        name = excluded.name,
        role = excluded.role,
        status = 'active'
    where public.academy_members.club_id = excluded.club_id
      and public.academy_members.user_id is null;
  end if;

  return new;
end;
$$;

create or replace function public.unlink_membership_roster_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.academy_members
  set user_id = null,
      status = 'inactive'
  where club_id = old.club_id
    and user_id = old.user_id;

  return old;
end;
$$;

drop trigger if exists sync_membership_roster_profile_on_write on public.club_memberships;
create trigger sync_membership_roster_profile_on_write
after insert or update of role, user_id, club_id
on public.club_memberships
for each row
execute function public.sync_membership_roster_profile();

drop trigger if exists unlink_membership_roster_profile_on_delete on public.club_memberships;
create trigger unlink_membership_roster_profile_on_delete
after delete
on public.club_memberships
for each row
execute function public.unlink_membership_roster_profile();
