insert into public.role_definitions (role, label, description, permissions) values
  (
    'owner',
    'Owner',
    'Full control over club settings, manual billing contact, roles, integrations, and all academy operations.',
    array['manage_club', 'manage_roles', 'manage_billing', 'manage_integrations', 'manage_classes', 'manage_members']
  ),
  (
    'admin',
    'Admin',
    'Runs daily operations: members, schedules, classes, posts, and reports.',
    array['manage_roles', 'manage_classes', 'manage_members', 'publish_feed', 'view_reports']
  ),
  (
    'coach',
    'Coach',
    'Manages assigned class check-ins, coach notes, attendance, and promotion recommendations.',
    array['manage_classes', 'coach_notes', 'recommend_promotions', 'view_members']
  ),
  (
    'member',
    'Member',
    'Can view assigned club, schedule, profile, attendance, rankings, and connected activity.',
    array['view_schedule', 'view_profile', 'connect_strava']
  )
on conflict (role) do update set
  label = excluded.label,
  description = excluded.description,
  permissions = excluded.permissions;
