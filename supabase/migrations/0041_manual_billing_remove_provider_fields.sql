alter table public.club_billing_subscriptions
drop column if exists stripe_customer_id,
drop column if exists stripe_subscription_id;

comment on table public.club_billing_subscriptions is
'Manual billing foundation for Grapply-managed plans, limits, billing contacts, and invoice status. External payment provider integration is intentionally not modeled yet.';
