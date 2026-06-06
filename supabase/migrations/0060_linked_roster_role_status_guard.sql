create or replace function public.prevent_linked_roster_role_status_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.membership_roster_sync', true) = 'on' then
    return new;
  end if;

  if old.user_id is not null
    and new.user_id = old.user_id
    and (
      new.role is distinct from old.role
      or new.status is distinct from old.status
    )
  then
    raise exception 'linked roster role and status are managed by club memberships';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_linked_roster_role_status_update_on_write on public.academy_members;
create trigger prevent_linked_roster_role_status_update_on_write
before update of role, status, user_id
on public.academy_members
for each row
execute function public.prevent_linked_roster_role_status_update();

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

  perform set_config('app.membership_roster_sync', 'on', true);

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
