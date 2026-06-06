update public.member_promotions
set belt = null
where type <> 'belt'
  and belt is not null;

update public.member_promotions
set stripes = null
where type in ('ranking', 'achievement')
  and stripes is not null;

update public.member_promotions
set stripes = coalesce(stripes, 0)
where type = 'belt'
  and stripes is null;

create or replace function public.prepare_member_promotion_rank()
returns trigger
language plpgsql
as $$
declare
  member public.academy_members%rowtype;
begin
  select *
  into member
  from public.academy_members
  where id = new.member_id
    and club_id = new.club_id
  for update;

  if not found then
    raise exception 'Member not found in this club.'
      using errcode = '23503';
  end if;

  if new.previous_belt is null then
    new.previous_belt := member.belt;
  end if;

  if new.previous_stripes is null then
    new.previous_stripes := member.stripes;
  end if;

  if new.type = 'stripe' then
    new.belt := null;

    if new.stripes is null or new.stripes < 1 or new.stripes > 4 then
      raise exception 'Stripe awards must be between 1 and 4.'
        using errcode = '22023';
    end if;

    if new.stripes <= member.stripes then
      raise exception 'Stripe awards must move the member forward.'
        using errcode = '23505';
    end if;
  elsif new.type = 'belt' then
    new.stripes := coalesce(new.stripes, 0);

    if new.belt is null then
      raise exception 'A valid belt is required for belt promotions.'
        using errcode = '22023';
    end if;

    if public.bjj_belt_rank(new.belt) <= public.bjj_belt_rank(member.belt) then
      raise exception 'Belt promotion must move the member forward.'
        using errcode = '23505';
    end if;
  else
    new.belt := null;
    new.stripes := null;
  end if;

  return new;
end;
$$;

alter table public.member_promotions
drop constraint if exists member_promotions_rank_fields_match_type;

alter table public.member_promotions
add constraint member_promotions_rank_fields_match_type
check (
  (
    type = 'stripe'
    and belt is null
    and stripes between 1 and 4
  )
  or (
    type = 'belt'
    and belt is not null
    and stripes between 0 and 4
  )
  or (
    type in ('ranking', 'achievement')
    and belt is null
    and stripes is null
  )
);
