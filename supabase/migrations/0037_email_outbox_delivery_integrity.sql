alter table public.email_outbox
add column if not exists attempts integer not null default 0;

update public.email_outbox
set attempts = 0
where attempts < 0;

update public.email_outbox
set sent_at = created_at
where status = 'sent'
  and sent_at is null;

update public.email_outbox
set sent_at = null
where status <> 'sent'
  and sent_at is not null;

alter table public.email_outbox
drop constraint if exists email_outbox_attempts_nonnegative;

alter table public.email_outbox
add constraint email_outbox_attempts_nonnegative
check (attempts >= 0);

alter table public.email_outbox
drop constraint if exists email_outbox_sent_at_matches_status;

alter table public.email_outbox
add constraint email_outbox_sent_at_matches_status
check (
  (status = 'sent' and sent_at is not null)
  or (status <> 'sent' and sent_at is null)
);
