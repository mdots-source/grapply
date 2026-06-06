update public.email_outbox
set to_email = lower(trim(to_email))
where to_email <> lower(trim(to_email));

delete from public.email_outbox
where to_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  or template not in (
    'club_invite',
    'invite_welcome',
    'invite_accepted_notification',
    'owner_welcome',
    'magic_link',
    'password_reset',
    'coach_notification',
    'admin_notification'
  );

alter table public.email_outbox
drop constraint if exists email_outbox_to_email_valid;

alter table public.email_outbox
add constraint email_outbox_to_email_valid
check (to_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');

alter table public.email_outbox
drop constraint if exists email_outbox_template_valid;

alter table public.email_outbox
add constraint email_outbox_template_valid
check (
  template in (
    'club_invite',
    'invite_welcome',
    'invite_accepted_notification',
    'owner_welcome',
    'magic_link',
    'password_reset',
    'coach_notification',
    'admin_notification'
  )
);
