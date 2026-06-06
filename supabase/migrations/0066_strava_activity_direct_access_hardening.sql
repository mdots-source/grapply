drop policy if exists "club staff can read strava activities" on public.strava_activities;

comment on table public.strava_activities is
'Synced Strava activity summaries. Direct RLS access is limited to the connected user; staff views must go through application APIs that enforce club role scope.';
