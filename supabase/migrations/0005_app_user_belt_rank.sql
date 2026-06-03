alter table public.app_users
  add column if not exists belt text default 'white' check (belt in ('white', 'blue', 'purple', 'brown', 'black')),
  add column if not exists stripes integer default 0 check (stripes between 0 and 4);

