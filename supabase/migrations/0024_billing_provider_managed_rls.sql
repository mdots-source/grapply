drop policy if exists "owners can manage club billing" on public.club_billing_subscriptions;

-- Billing state is managed manually by the Grapply team for now.
-- Owners can read it through RLS, while writes go through the backend service role.
