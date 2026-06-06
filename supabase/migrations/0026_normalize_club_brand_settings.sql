update public.club_settings settings
set value = jsonb_strip_nulls(
  jsonb_build_object(
    'academyName', coalesce(settings.value->>'academyName', settings.value->>'name', clubs.name),
    'location', coalesce(settings.value->>'location', clubs.location),
    'description', coalesce(
      settings.value->>'description',
      clubs.name || ' runs Brazilian Jiu-Jitsu classes, member progression, and academy operations in Grapply.'
    ),
    'logoLabel', left(
      coalesce(
        settings.value->>'logoLabel',
        settings.value->>'shortName',
        upper(left(regexp_replace(clubs.name, '[^[:alnum:]]+', '', 'g'), 3)),
        'G'
      ),
      6
    ),
    'mats', coalesce(settings.value->>'mats', 'Main Mat'),
    'classTypes', coalesce(settings.value->>'classTypes', 'Gi, No-Gi, Fundamentals, Competition, Open Mat'),
    'primaryColor', coalesce(settings.value->>'primaryColor', '#7c3aed'),
    'accentColor', coalesce(settings.value->>'accentColor', '#22c55e')
  )
)
from public.clubs
where settings.club_id = clubs.id
  and settings.key = 'brand'
  and (
    not (settings.value ? 'academyName')
    or not (settings.value ? 'location')
    or not (settings.value ? 'logoLabel')
    or (settings.value ? 'name')
    or (settings.value ? 'shortName')
  );

insert into public.club_settings (club_id, key, value)
select
  clubs.id,
  'brand',
  jsonb_build_object(
    'academyName', clubs.name,
    'location', clubs.location,
    'description', clubs.name || ' runs Brazilian Jiu-Jitsu classes, member progression, and academy operations in Grapply.',
    'logoLabel', coalesce(upper(left(regexp_replace(clubs.name, '[^[:alnum:]]+', '', 'g'), 3)), 'G'),
    'mats', 'Main Mat',
    'classTypes', 'Gi, No-Gi, Fundamentals, Competition, Open Mat',
    'primaryColor', '#7c3aed',
    'accentColor', '#22c55e'
  )
from public.clubs
where not exists (
  select 1
  from public.club_settings settings
  where settings.club_id = clubs.id
    and settings.key = 'brand'
);
