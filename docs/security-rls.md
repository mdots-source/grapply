# Grapply RLS Access Matrix

This is the expected database access model for direct Supabase access. Server API routes still enforce the same rules before using the service role.

## Account And Club

| Table | Member | Coach | Admin | Owner |
| --- | --- | --- | --- | --- |
| `app_users` | Own profile | Own profile | Own profile + coach/member users in managed clubs | Own profile + users in owned clubs |
| `clubs` | Clubs they belong to | Clubs they belong to | Clubs they belong to | Clubs they belong to |
| `club_memberships` | Own membership | Own membership | Read/manage coach/member access | Read/manage non-owner access |
| `club_invites` | No direct access | No direct access | Manage coach/member invites | Manage non-owner invites |

Owner rows cannot be created or changed from the admin invite/role screens. Owner access is reserved for account/workspace creation and manual support actions.

## Academy Data

| Table | Member | Coach | Admin | Owner |
| --- | --- | --- | --- | --- |
| `academy_members` | Own linked member profile | Club roster | Club roster + manage members | Club roster + manage members |
| `club_classes` | Read club classes | Read/manage classes | Read/manage classes | Read/manage classes |
| `class_checkins` | Own attendance | Club attendance; delete only own same-day check-ins | Club attendance | Club attendance |
| `coach_notes` | No direct access | Staff notes + own private notes | Staff/private notes | Staff/private notes |
| `member_promotions` | Own promotions | Club promotions | Club promotions + manage promotions | Club promotions + manage promotions |
| `member_goals` | Own goals | Club goals + manage goals | Club goals + manage goals | Club goals + manage goals |

## Planning And Feed

| Table | Member | Coach | Admin | Owner |
| --- | --- | --- | --- | --- |
| `competitions` | Only items where they are registered | Read/manage | Read/manage | Read/manage |
| `training_camps` | Only items where they are registered | Read/manage | Read/manage | Read/manage |
| `training_posts` | Public/own tagged posts | Read/manage | Read/manage | Read/manage |
| `dashboard_events` | No direct access | Read | Read | Read |
| `club_settings` | Read settings | Read settings | Read/manage | Read/manage |

## Integrations And Operations

| Table | Member | Coach | Admin | Owner |
| --- | --- | --- | --- | --- |
| `strava_connections` | No direct token access | No direct token access | No direct token access | No direct token access |
| `strava_activities` | Own activities in active clubs | Own activities + staff reads via API | Own activities + staff reads via API | Own activities + staff reads via API |
| `email_outbox` | No direct access | No direct access | Read/queue club email | Read/queue club email |
| `app_error_events` | No direct access | No direct access | No direct access | Read only events scoped to owned clubs |
| `club_billing_subscriptions` | No direct access | No direct access | No direct access | Read/manage manual billing contact |

## Production Check

Before a production demo, apply every migration through the latest file in `supabase/migrations/`, then verify these flows:

1. A member can only see their linked member profile, own attendance, own promotions, own goals, and allowed planning/feed items.
2. A coach can create classes, check-ins, notes, goals, competitions, camps, and feed posts, can read Settings for appearance/integrations, but cannot access Admin, Billing, or role management.
3. An admin can manage coach/member invites and memberships, but cannot invite/admin-manage admins or owners.
4. An owner can manage non-owner users, settings, manual billing contact, and see only own-club backend error events.
5. Schedule writes are protected in the database: class time must be `HH:MM`, text fields cannot be blank, duration cannot run past midnight, and classes cannot overlap on the same mat/day.
