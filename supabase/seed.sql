insert into public.app_users (id, name, email, avatar_url, belt, stripes) values
  ('00000000-0000-0000-0000-000000000101', 'Sofia Almeida', 'sofia@grapply.app', '/avatars/sofia-almeida.png', 'black', 3),
  ('00000000-0000-0000-0000-000000000102', 'Maya Ribeiro', 'maya@grapply.app', '/avatars/maya-ribeiro.png', 'purple', 2),
  ('00000000-0000-0000-0000-000000000103', 'Eli Morgan', 'eli@grapply.app', '/avatars/eli-morgan.png', 'white', 3),
  ('00000000-0000-0000-0000-000000000104', 'Nina Park', 'nina@grapply.app', null, 'white', 0),
  ('00000000-0000-0000-0000-000000000105', 'Diego Alvarez', 'diego@grapply.app', '/avatars/noah-keller.png', 'black', 1),
  ('00000000-0000-0000-0000-000000000106', 'Zoe Chen', 'zoe@grapply.app', '/avatars/eli-morgan.png', 'blue', 3),
  ('00000000-0000-0000-0000-000000000107', 'Omar Haddad', 'omar@grapply.app', '/avatars/sofia-almeida.png', 'purple', 1),
  ('00000000-0000-0000-0000-000000000108', 'Priya Nair', 'priya@grapply.app', '/avatars/maya-ribeiro.png', 'white', 2),
  ('00000000-0000-0000-0000-000000000109', 'Marcus Reed', 'marcus@grapply.app', '/avatars/noah-keller.png', 'blue', 0),
  ('00000000-0000-0000-0000-000000000110', 'Ana Costa', 'ana@grapply.app', '/avatars/sofia-almeida.png', 'purple', 3)
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  avatar_url = excluded.avatar_url,
  belt = excluded.belt,
  stripes = excluded.stripes;

insert into public.clubs (id, slug, name, location, status, member_count, primary_coach) values
  ('00000000-0000-0000-0000-000000000201', 'grapply-bjj', 'Grapply Jiu-Jitsu Academy', 'San Diego, CA', 'active', 212, 'Sofia Almeida'),
  ('00000000-0000-0000-0000-000000000202', 'alpine-grappling', 'Alpine Grappling Club', 'Zurich, CH', 'active', 86, 'Noah Keller'),
  ('00000000-0000-0000-0000-000000000203', 'harbor-nogi', 'Harbor No-Gi Lab', 'Long Beach, CA', 'pending', 34, 'Lina Okafor')
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  location = excluded.location,
  status = excluded.status,
  member_count = excluded.member_count,
  primary_coach = excluded.primary_coach;

insert into public.role_definitions (role, label, description, permissions) values
  ('owner', 'Owner', 'Full control over club settings, billing, roles, integrations, and all academy operations.', array['manage_club', 'manage_roles', 'manage_billing', 'manage_integrations', 'manage_classes', 'view_members']),
  ('admin', 'Admin', 'Runs daily operations: members, schedules, classes, posts, and reports.', array['manage_roles', 'manage_classes', 'manage_members', 'publish_feed', 'view_reports']),
  ('coach', 'Coach', 'Manages class check-ins, coach notes, attendance, and promotion recommendations.', array['manage_classes', 'coach_notes', 'recommend_promotions', 'view_members']),
  ('member', 'Member', 'Can view assigned club, schedule, profile, attendance, rankings, and connected activity.', array['view_schedule', 'view_profile', 'connect_strava'])
on conflict (role) do update set
  label = excluded.label,
  description = excluded.description,
  permissions = excluded.permissions;

insert into public.club_memberships (id, user_id, club_id, role, invited_by, joined_at) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'owner', null, '2025-01-08'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000202', 'coach', 'Noah Keller', '2026-02-14'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000201', 'admin', 'Sofia Almeida', '2025-06-20'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000201', 'member', 'Maya Ribeiro', '2026-03-02'),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000201', 'coach', 'Sofia Almeida', '2025-11-10'),
  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000201', 'member', 'Maya Ribeiro', '2026-01-18'),
  ('00000000-0000-0000-0000-000000000307', '00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000202', 'member', 'Noah Keller', '2026-02-03'),
  ('00000000-0000-0000-0000-000000000308', '00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000203', 'member', 'Lina Okafor', '2026-04-12'),
  ('00000000-0000-0000-0000-000000000309', '00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000201', 'member', 'Sofia Almeida', '2026-04-22'),
  ('00000000-0000-0000-0000-000000000310', '00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000201', 'admin', 'Sofia Almeida', '2025-09-14'),
  ('00000000-0000-0000-0000-000000000311', '00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000203', 'coach', 'Lina Okafor', '2026-05-01')
on conflict (user_id, club_id) do update set
  role = excluded.role,
  invited_by = excluded.invited_by,
  joined_at = excluded.joined_at;

insert into public.club_classes (id, club_id, name, coach, day, time, mat, level, checked_in) values
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000201', 'Dawn Patrol Gi', 'Sofia Almeida', 'Mon', '06:30', 'Mat A', 'blue / purple / brown / black', 18),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000201', 'Lunch No-Gi', 'Lina Okafor', 'Tue', '12:00', 'Mat B', 'white / blue / purple', 22),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000201', 'Kids Competition', 'Noah Keller', 'Wed', '17:30', 'Mat A', 'white / blue', 14),
  ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000201', 'Advanced No-Gi', 'Sofia Almeida', 'Thu', '19:00', 'Main Mat', 'purple / brown / black', 31),
  ('00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000202', 'Gi Fundamentals', 'Noah Keller', 'Tue', '18:00', 'Mat 1', 'white / blue', 16),
  ('00000000-0000-0000-0000-000000000406', '00000000-0000-0000-0000-000000000203', 'No-Gi Wrestling Entries', 'Lina Okafor', 'Sat', '10:30', 'Main Mat', 'blue / purple / brown / black', 12),
  ('00000000-0000-0000-0000-000000000407', '00000000-0000-0000-0000-000000000202', 'Takedown Lab', 'Ana Costa', 'Thu', '19:30', 'Mat 2', 'blue / purple / brown', 18),
  ('00000000-0000-0000-0000-000000000408', '00000000-0000-0000-0000-000000000203', 'Women Only Fundamentals', 'Lina Okafor', 'Wed', '18:30', 'Main Mat', 'white / blue', 19),
  ('00000000-0000-0000-0000-000000000409', '00000000-0000-0000-0000-000000000201', 'Sunday Open Mat', 'Maya Ribeiro', 'Sun', '11:00', 'Main Mat', 'all belts', 27)
on conflict (id) do update set
  club_id = excluded.club_id,
  name = excluded.name,
  coach = excluded.coach,
  day = excluded.day,
  time = excluded.time,
  mat = excluded.mat,
  level = excluded.level,
  checked_in = excluded.checked_in;

insert into public.academy_members (
  id,
  club_id,
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
) values
  ('st-003', '00000000-0000-0000-0000-000000000201', 'Sofia Almeida', 'black', 3, 'coach', 'active', 2840, 22, 14, 2440, 42, 4, 'Competition Team', 'Pressure passing', '/avatars/sofia-almeida.png', '{"roleLabel":"Head coach","weeklyAttendance":6}'::jsonb),
  ('st-005', '00000000-0000-0000-0000-000000000201', 'Lina Okafor', 'brown', 2, 'coach', 'active', 1960, 19, 11, 2110, 31, 8, 'No-Gi Advanced', 'Back control', '/avatars/maya-ribeiro.png', '{"roleLabel":"Coach","weeklyAttendance":5}'::jsonb),
  ('st-002', '00000000-0000-0000-0000-000000000201', 'Noah Keller', 'black', 1, 'coach', 'active', 1720, 16, 6, 1510, 18, 9, 'No-Gi Advanced', 'Leg entries', '/avatars/noah-keller.png', '{"roleLabel":"Coach","weeklyAttendance":4}'::jsonb),
  ('st-001', '00000000-0000-0000-0000-000000000201', 'Maya Ribeiro', 'purple', 2, 'member', 'active', 412, 18, 9, 1840, 24, 6, 'Open Mat', 'Guard retention', '/avatars/maya-ribeiro.png', '{"roleLabel":"Competition team","weeklyAttendance":5}'::jsonb),
  ('st-014', '00000000-0000-0000-0000-000000000201', 'Ana Costa', 'purple', 3, 'member', 'active', 458, 21, 12, 1920, 28, 7, 'Competition Team', 'Knee cut chains', '/avatars/sofia-almeida.png', '{"roleLabel":"Competition team","weeklyAttendance":6}'::jsonb),
  ('st-007', '00000000-0000-0000-0000-000000000201', 'Camille Duran', 'purple', 0, 'member', 'active', 318, 14, 5, 1660, 17, 5, 'Women Only', 'Arm drags', '/avatars/maya-ribeiro.png', '{"roleLabel":"Member","weeklyAttendance":3}'::jsonb),
  ('st-011', '00000000-0000-0000-0000-000000000201', 'Omar Haddad', 'purple', 1, 'member', 'inactive', 276, 2, 0, 1180, 12, 10, '18 days ago', 'Passing posture', '/avatars/sofia-almeida.png', '{"roleLabel":"Member","weeklyAttendance":0,"attendanceRisk":"high"}'::jsonb),
  ('st-010', '00000000-0000-0000-0000-000000000201', 'Zoe Chen', 'blue', 3, 'member', 'active', 244, 17, 8, 1320, 13, 8, 'Lunch No-Gi', 'Wrestle-ups', '/avatars/eli-morgan.png', '{"roleLabel":"Member","weeklyAttendance":4}'::jsonb),
  ('st-016', '00000000-0000-0000-0000-000000000201', 'Keiko Tanaka', 'blue', 2, 'member', 'active', 218, 13, 6, 1240, 11, 6, 'Dawn Patrol Gi', 'Collar sleeve', '/avatars/maya-ribeiro.png', '{"roleLabel":"Member","weeklyAttendance":4}'::jsonb),
  ('st-006', '00000000-0000-0000-0000-000000000201', 'Arjun Patel', 'blue', 1, 'member', 'active', 186, 4, 0, 890, 9, 12, '12 days ago', 'Half guard', '/avatars/noah-keller.png', '{"roleLabel":"Member","weeklyAttendance":1,"attendanceRisk":"high"}'::jsonb),
  ('st-013', '00000000-0000-0000-0000-000000000201', 'Marcus Reed', 'blue', 0, 'member', 'active', 164, 10, 4, 760, 7, 9, 'Open Mat', 'Single-leg defense', '/avatars/noah-keller.png', '{"roleLabel":"Member","weeklyAttendance":3}'::jsonb),
  ('st-004', '00000000-0000-0000-0000-000000000201', 'Eli Morgan', 'white', 3, 'member', 'active', 124, 11, 3, 620, 5, 7, 'Fundamentals', 'Escapes', '/avatars/eli-morgan.png', '{"roleLabel":"Trial member","weeklyAttendance":3,"trial":true,"attendanceRisk":"medium"}'::jsonb),
  ('st-012', '00000000-0000-0000-0000-000000000201', 'Priya Nair', 'white', 2, 'member', 'active', 88, 8, 5, 560, 4, 4, 'Women Only', 'Hip escapes', '/avatars/maya-ribeiro.png', '{"roleLabel":"Trial member","weeklyAttendance":3,"trial":true}'::jsonb),
  ('st-008', '00000000-0000-0000-0000-000000000201', 'Mateo Silva', 'white', 1, 'member', 'active', 96, 9, 4, 510, 3, 6, 'Fundamentals', 'Frames', '/avatars/noah-keller.png', '{"roleLabel":"Member","weeklyAttendance":2}'::jsonb),
  ('st-015', '00000000-0000-0000-0000-000000000201', 'Ben Novak', 'white', 0, 'member', 'inactive', 42, 1, 0, 240, 1, 5, '21 days ago', 'Base and posture', '/avatars/eli-morgan.png', '{"roleLabel":"Trial member","weeklyAttendance":0,"trial":true,"attendanceRisk":"high"}'::jsonb)
on conflict (id) do update set
  club_id = excluded.club_id,
  name = excluded.name,
  belt = excluded.belt,
  stripes = excluded.stripes,
  role = excluded.role,
  status = excluded.status,
  total_hours = excluded.total_hours,
  classes_30 = excluded.classes_30,
  streak = excluded.streak,
  points = excluded.points,
  wins = excluded.wins,
  losses = excluded.losses,
  last_seen = excluded.last_seen,
  focus = excluded.focus,
  avatar_url = excluded.avatar_url,
  profile = excluded.profile;

insert into public.strava_connections (user_id, athlete_id, access_token, refresh_token, expires_at, scopes) values
  ('00000000-0000-0000-0000-000000000101', '12345678', 'demo-access-token', 'demo-refresh-token', 1893456000, array['read', 'profile:read_all', 'activity:read_all']),
  ('00000000-0000-0000-0000-000000000105', '44009112', 'demo-access-token', 'demo-refresh-token', 1893456000, array['read', 'profile:read_all', 'activity:read_all']),
  ('00000000-0000-0000-0000-000000000106', '55110223', 'demo-access-token', 'demo-refresh-token', 1893456000, array['read', 'profile:read_all', 'activity:read_all']),
  ('00000000-0000-0000-0000-000000000109', '88234501', 'demo-access-token', 'demo-refresh-token', 1893456000, array['read', 'profile:read_all', 'activity:read_all']),
  ('00000000-0000-0000-0000-000000000110', '99012345', 'demo-access-token', 'demo-refresh-token', 1893456000, array['read', 'profile:read_all', 'activity:read_all'])
on conflict (user_id) do update set
  athlete_id = excluded.athlete_id,
  access_token = excluded.access_token,
  refresh_token = excluded.refresh_token,
  expires_at = excluded.expires_at,
  scopes = excluded.scopes;
-- product seed generated from data/*.ts
insert into public.competitions (id, club_id, name, date_text, location, city, venue, registered_member_ids, registration_deadline, status, notes, type, prep) values
  ('ibjjf-la-open', '00000000-0000-0000-0000-000000000201', 'IBJJF Los Angeles Open', 'June 28, 2026', 'Los Angeles, CA', 'Los Angeles, CA', 'Long Beach Convention Center', array['st-001', 'st-002', 'st-003', 'st-005', 'st-007'], 'June 20, 2026', 'Registration open', 'Registration closes in 8 days. Gi and No-Gi divisions available.', 'Gi / No-Gi', 82),
  ('ibjjf-zurich-open', '00000000-0000-0000-0000-000000000201', 'IBJJF Zurich Open', 'June 14, 2026', 'Zurich, CH', 'Zurich, CH', 'Sporthalle Hardau', array['st-001', 'st-002', 'st-003', 'st-007'], 'May 31, 2026', 'Registration open', 'Travel roster confirmed. Final weigh-ins scheduled on-site.', 'Gi / No-Gi', 76),
  ('alps-grappling-cup', '00000000-0000-0000-0000-000000000201', 'Alps Grappling Cup', 'July 5, 2026', 'Geneva, CH', 'Geneva, CH', 'Arena Vernets', array['st-002', 'st-005', 'st-006'], 'June 18, 2026', 'Planning', 'No-Gi only. Team camp the week before.', 'No-Gi', 58),
  ('european-masters', '00000000-0000-0000-0000-000000000201', 'European Masters Trials', 'August 22, 2026', 'Milan, IT', 'Milan, IT', 'Centro Sportivo Pavesi', array['st-003', 'st-005'], 'July 29, 2026', 'Invite list', 'Invite-only event for brown and black belts.', 'Gi', 44)
on conflict (id) do update set name=excluded.name, date_text=excluded.date_text, location=excluded.location, city=excluded.city, venue=excluded.venue, registered_member_ids=excluded.registered_member_ids, registration_deadline=excluded.registration_deadline, status=excluded.status, notes=excluded.notes, type=excluded.type, prep=excluded.prep;

insert into public.training_camps (id, club_id, name, date_text, end_date_text, location, city, venue, host, focus, registered_member_ids, registration_deadline, status, notes, type, prep, spots_total, estimated_cost) values
  ('aoj-summer-immersion', '00000000-0000-0000-0000-000000000201', 'AOJ Summer Immersion Camp', 'July 12, 2026', 'July 18, 2026', 'San Diego, CA', 'San Diego, CA', 'AOJ HQ Academy', 'André Galvão Team', 'Passing systems, leg locks, competition rounds', array['st-001', 'st-002', 'st-003', 'st-007'], 'June 28, 2026', 'Registration open', '7-day residential camp. Hotel block reserved near academy. Team flights grouped for Zurich departure.', 'Gi / No-Gi', 74, 24, '$1,850'),
  ('berimbolo-lab-lisbon', '00000000-0000-0000-0000-000000000201', 'Berimbolo Lab Lisbon', 'August 3, 2026', 'August 6, 2026', 'Lisbon, PT', 'Lisbon, PT', 'Icon Jiu-Jitsu Lisboa', 'Lachlan Giles & Grapply guest coaches', 'Berimbolo entries, back attacks, modern guard', array['st-001', 'st-005', 'st-006'], 'July 15, 2026', 'Planning', 'Weekend intensive with evening open mats. Good add-on before European Masters season.', 'Gi', 52, 18, '$690'),
  ('mountain-gi-retreat', '00000000-0000-0000-0000-000000000201', 'Alpine Gi Retreat', 'September 19, 2026', 'September 22, 2026', 'Zermatt, CH', 'Zermatt, CH', 'Grapply Mountain Lodge', 'Sofia Almeida & Lina Okafor', 'Fundamentals refinement, mobility, mindset', array['st-003', 'st-004', 'st-008'], 'August 30, 2026', 'Early bird', 'Academy-only retreat with lodging and meals included. Limited to 16 athletes.', 'Gi', 38, 16, '$1,120'),
  ('nogi-radar-camp', '00000000-0000-0000-0000-000000000201', 'No-Gi Radar Camp', 'October 10, 2026', 'October 12, 2026', 'London, UK', 'London, UK', 'Roger Gracie Academy', 'Grapply competition team', 'Wrestling ties, leg entanglements, ADCC prep', array['st-002', 'st-005'], 'September 20, 2026', 'Waitlist', 'High demand camp. Waitlist opens if an athlete drops. Travel support available.', 'No-Gi', 28, 20, '$540')
on conflict (id) do update set name=excluded.name, date_text=excluded.date_text, end_date_text=excluded.end_date_text, location=excluded.location, city=excluded.city, venue=excluded.venue, host=excluded.host, focus=excluded.focus, registered_member_ids=excluded.registered_member_ids, registration_deadline=excluded.registration_deadline, status=excluded.status, notes=excluded.notes, type=excluded.type, prep=excluded.prep, spots_total=excluded.spots_total, estimated_cost=excluded.estimated_cost;

insert into public.training_posts (id, club_id, type, pinned, class_name, coach, date_text, time_text, title, summary, attendance, top_participant, sparring_highlight, achievements, tagged_students, reactions, comments, heat) values
  ('tf-1', '00000000-0000-0000-0000-000000000201', 'session', true, 'Advanced No-Gi', 'Sofia Almeida', 'Today', '19:00', 'Guard retention into back attacks', 'Eight five-minute rounds with positional starts from headquarters. Competition team logged 44 exchanges with strong back attack finishes.', 31, '{"name":"Maya Ribeiro","note":"9 rounds · highest intensity"}'::jsonb, 'Turtle to back chain — 14 successful finishes recorded on the floor.', null, array['Maya Ribeiro', 'Camille Duran', 'Noah Keller'], 48, 12, 94),
  ('tf-2', '00000000-0000-0000-0000-000000000201', 'promotion', false, null, 'Sofia Almeida', 'Today', '11:18', 'Noah Keller — 4th stripe on Black Belt', 'Awarded after consistent competition prep and leadership in advanced rounds.', null, null, null, array['Black belt stripe milestone'], array['Noah Keller'], 86, 24, 91),
  ('tf-3', '00000000-0000-0000-0000-000000000201', 'competition', false, null, 'Lina Okafor', 'Yesterday', '16:40', 'IBJJF LA Open — team weigh-in complete', 'All registered athletes cleared weight. Final rules review scheduled Saturday 11:00.', 5, null, null, null, array['Maya Ribeiro', 'Sofia Almeida', 'Camille Duran'], 32, 8, 78),
  ('tf-4', '00000000-0000-0000-0000-000000000201', 'open-mat', false, 'Sunday Open Mat', 'Lina Okafor', 'Sunday', '12:00', 'Recovery flow + 90-minute open mat', 'All belts welcome. Flow rounds followed by free sparring — 28 check-ins, great community energy.', 28, null, 'Best exchange: purple belt sweep to mount transition drill.', null, null, 41, 15, 72),
  ('tf-5', '00000000-0000-0000-0000-000000000201', 'milestone', false, null, 'Noah Keller', 'Yesterday', '09:15', 'Eli Morgan — beginner streak unlocked', 'Three consecutive fundamentals classes with improved escape scores.', null, null, null, array['3-class beginner streak', 'Attendance +22%'], array['Eli Morgan'], 55, 9, 68),
  ('tf-6', '00000000-0000-0000-0000-000000000201', 'announcement', false, null, 'Sofia Almeida', 'This week', '08:00', 'Friday schedule change', 'Fight Night Rounds moves to Main Mat at 19:30 for competition prep week.', null, null, null, null, null, 19, 4, 54)
on conflict (id) do update set type=excluded.type, pinned=excluded.pinned, class_name=excluded.class_name, coach=excluded.coach, date_text=excluded.date_text, time_text=excluded.time_text, title=excluded.title, summary=excluded.summary, attendance=excluded.attendance, top_participant=excluded.top_participant, sparring_highlight=excluded.sparring_highlight, achievements=excluded.achievements, tagged_students=excluded.tagged_students, reactions=excluded.reactions, comments=excluded.comments, heat=excluded.heat;

insert into public.dashboard_events (id, club_id, category, title, body, actor, meta, occurred_at_text) values
  ('n1', '00000000-0000-0000-0000-000000000201', 'announcement', 'Friday schedule change', 'Fight Night Rounds moves to Main Mat at 19:30 this week for competition prep.', 'Schedule', '{"tag":"Schedule"}'::jsonb, 'Today'),
  ('n2', '00000000-0000-0000-0000-000000000201', 'announcement', 'Sunday open mat expanded', 'Recovery Flow followed by 90-minute open mat. All belts welcome.', 'Open Mat', '{"tag":"Open Mat"}'::jsonb, 'Tomorrow'),
  ('n3', '00000000-0000-0000-0000-000000000201', 'announcement', 'IBJJF LA Open prep seminar', 'Mandatory rules review for registered athletes — Saturday 11:00.', 'Competition', '{"tag":"Competition"}'::jsonb, 'This week'),
  ('a1', '00000000-0000-0000-0000-000000000201', 'coach_action', 'Marked 6 students present for Lunch No-Gi', null, 'Lina Okafor', '{}'::jsonb, '12:42 PM'),
  ('a2', '00000000-0000-0000-0000-000000000201', 'coach_action', 'Approved stripe promotion for Noah Keller', null, 'Sofia Almeida', '{}'::jsonb, '11:18 AM'),
  ('a3', '00000000-0000-0000-0000-000000000201', 'coach_action', 'Updated competition roster for Zurich Open', null, 'Sofia Almeida', '{}'::jsonb, '9:55 AM'),
  ('a4', '00000000-0000-0000-0000-000000000201', 'coach_action', 'Sent re-engagement message to inactive members', null, 'Noah Keller', '{}'::jsonb, 'Yesterday'),
  ('p1', '00000000-0000-0000-0000-000000000201', 'promotion', 'Received 4th stripe on Black Belt', 'Noah Keller', 'Sofia Almeida', '{"type":"stripe","student":"Noah Keller"}'::jsonb, '2 hours ago'),
  ('p2', '00000000-0000-0000-0000-000000000201', 'promotion', 'Moved to #2 in academy rankings', 'Maya Ribeiro', 'System', '{"type":"ranking","student":"Maya Ribeiro"}'::jsonb, 'Yesterday'),
  ('p3', '00000000-0000-0000-0000-000000000201', 'promotion', 'Beginner streak achievement unlocked', 'Eli Morgan', 'Noah Keller', '{"type":"achievement","student":"Eli Morgan"}'::jsonb, 'Yesterday'),
  ('p4', '00000000-0000-0000-0000-000000000201', 'promotion', 'Promoted to Purple Belt', 'Camille Duran', 'Sofia Almeida', '{"type":"belt","student":"Camille Duran"}'::jsonb, '3 days ago')
on conflict (id) do update set category=excluded.category, title=excluded.title, body=excluded.body, actor=excluded.actor, meta=excluded.meta, occurred_at_text=excluded.occurred_at_text;

insert into public.club_settings (club_id, key, value) values
  ('00000000-0000-0000-0000-000000000201', 'appearance', '{"theme":"dark","accent":"purple"}'::jsonb),
  ('00000000-0000-0000-0000-000000000201', 'brand', '{"name":"Grapply Jiu-Jitsu Academy","shortName":"Grapply"}'::jsonb),
  ('00000000-0000-0000-0000-000000000201', 'integrations', '{"strava":true,"supabase":true}'::jsonb)
on conflict (club_id, key) do update set value=excluded.value;

insert into public.class_checkins (club_id, class_id, member_id, checked_in_by, source, notes) values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000404', 'st-001', '00000000-0000-0000-0000-000000000101', 'kiosk', 'Competition round checked in'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000404', 'st-014', '00000000-0000-0000-0000-000000000101', 'manual', 'Takedown lab lead'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000402', 'st-010', '00000000-0000-0000-0000-000000000102', 'strava', 'Conditioning synced'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000409', 'st-013', '00000000-0000-0000-0000-000000000101', 'qr', 'Open mat QR')
on conflict (class_id, member_id) do update set
  checked_in_by = excluded.checked_in_by,
  source = excluded.source,
  notes = excluded.notes;

insert into public.coach_notes (club_id, member_id, coach_user_id, coach_name, body, visibility) values
  ('00000000-0000-0000-0000-000000000201', 'st-001', '00000000-0000-0000-0000-000000000101', 'Sofia Almeida', 'Excellent guard retention. Ready for advanced passing chains.', 'staff'),
  ('00000000-0000-0000-0000-000000000201', 'st-006', '00000000-0000-0000-0000-000000000101', 'Sofia Almeida', '12 days absent. Schedule re-engagement check-in.', 'staff'),
  ('00000000-0000-0000-0000-000000000201', 'st-014', '00000000-0000-0000-0000-000000000101', 'Sofia Almeida', 'Build camp around knee cut to back take.', 'staff'),
  ('00000000-0000-0000-0000-000000000201', 'st-012', '00000000-0000-0000-0000-000000000105', 'Diego Alvarez', 'Great fundamentals retention; start guard passing basics.', 'staff');

insert into public.member_promotions (club_id, member_id, awarded_by, awarded_by_name, type, belt, stripes, detail) values
  ('00000000-0000-0000-0000-000000000201', 'st-002', '00000000-0000-0000-0000-000000000101', 'Sofia Almeida', 'stripe', 'black', 4, 'Received 4th stripe on Black Belt'),
  ('00000000-0000-0000-0000-000000000201', 'st-007', '00000000-0000-0000-0000-000000000101', 'Sofia Almeida', 'belt', 'purple', 0, 'Promoted to Purple Belt'),
  ('00000000-0000-0000-0000-000000000201', 'st-004', '00000000-0000-0000-0000-000000000105', 'Diego Alvarez', 'achievement', 'white', 3, 'Beginner streak achievement unlocked');

insert into public.club_invites (club_id, email, role, invited_by, status) values
  ('00000000-0000-0000-0000-000000000201', 'coach-invite@grapply.app', 'coach', '00000000-0000-0000-0000-000000000101', 'pending'),
  ('00000000-0000-0000-0000-000000000201', 'new-member@grapply.app', 'member', '00000000-0000-0000-0000-000000000102', 'pending')
on conflict (club_id, email) do update set
  role = excluded.role,
  invited_by = excluded.invited_by,
  status = excluded.status;

insert into public.member_goals (club_id, member_id, title, status, target_date) values
  ('00000000-0000-0000-0000-000000000201', 'st-001', 'Win purple belt division at IBJJF LA Open', 'active', '2026-06-28'),
  ('00000000-0000-0000-0000-000000000201', 'st-010', 'Complete 12 no-gi classes before camp', 'active', '2026-07-12'),
  ('00000000-0000-0000-0000-000000000201', 'st-006', 'Return to two classes per week', 'active', '2026-06-15');
