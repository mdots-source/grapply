update public.club_invites
set email = lower(trim(email))
where email <> lower(trim(email));

delete from public.club_invites as invite
using public.club_invites as duplicate
where invite.ctid < duplicate.ctid
  and invite.club_id = duplicate.club_id
  and lower(invite.email) = lower(duplicate.email);

alter table public.club_invites
drop constraint if exists club_invites_role_not_owner;

alter table public.club_invites
add constraint club_invites_role_not_owner
check (role <> 'owner');

create unique index if not exists club_invites_club_lower_email_key
on public.club_invites(club_id, lower(email));

drop policy if exists "owners can manage all invites and admins can manage non-admin invites" on public.club_invites;
create policy "owners can manage non-owner invites and admins can manage coach member invites"
on public.club_invites for all
using (
  role <> 'owner'
  and (
    public.current_user_club_role(club_id) = 'owner'
    or (
      public.current_user_club_role(club_id) = 'admin'
      and role in ('coach', 'member')
    )
  )
)
with check (
  role <> 'owner'
  and (
    public.current_user_club_role(club_id) = 'owner'
    or (
      public.current_user_club_role(club_id) = 'admin'
      and role in ('coach', 'member')
    )
  )
);
