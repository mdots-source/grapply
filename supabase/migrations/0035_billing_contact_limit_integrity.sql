update public.club_billing_subscriptions
set billing_email = lower(trim(billing_email))
where billing_email is not null
  and billing_email <> lower(trim(billing_email));

update public.club_billing_subscriptions
set billing_email = null
where billing_email is not null
  and billing_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$';

update public.club_billing_subscriptions
set member_limit = seats_included
where member_limit < seats_included;

alter table public.club_billing_subscriptions
drop constraint if exists club_billing_subscriptions_billing_email_valid;

alter table public.club_billing_subscriptions
add constraint club_billing_subscriptions_billing_email_valid
check (
  billing_email is null
  or billing_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
);

alter table public.club_billing_subscriptions
drop constraint if exists club_billing_subscriptions_limits_valid;

alter table public.club_billing_subscriptions
add constraint club_billing_subscriptions_limits_valid
check (seats_included > 0 and member_limit >= seats_included);
