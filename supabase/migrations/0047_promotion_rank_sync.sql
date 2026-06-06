create or replace function public.bjj_belt_rank(belt public.bjj_belt)
returns integer
language sql
immutable
as $$
  select case belt
    when 'white' then 0
    when 'blue' then 1
    when 'purple' then 2
    when 'brown' then 3
    when 'black' then 4
  end;
$$;

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
    if new.stripes is null or new.stripes < 1 or new.stripes > 4 then
      raise exception 'Stripe awards must be between 1 and 4.'
        using errcode = '22023';
    end if;

    if new.stripes <= member.stripes then
      raise exception 'Stripe awards must move the member forward.'
        using errcode = '23505';
    end if;
  end if;

  if new.type = 'belt' then
    if new.belt is null then
      raise exception 'A valid belt is required for belt promotions.'
        using errcode = '22023';
    end if;

    if public.bjj_belt_rank(new.belt) <= public.bjj_belt_rank(member.belt) then
      raise exception 'Belt promotion must move the member forward.'
        using errcode = '23505';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.apply_member_promotion_rank()
returns trigger
language plpgsql
as $$
begin
  if new.type = 'stripe' then
    update public.academy_members
    set stripes = new.stripes
    where id = new.member_id
      and club_id = new.club_id;
  elsif new.type = 'belt' then
    update public.academy_members
    set
      belt = new.belt,
      stripes = coalesce(new.stripes, 0)
    where id = new.member_id
      and club_id = new.club_id;
  end if;

  return new;
end;
$$;

create or replace function public.rollback_deleted_member_promotion_rank()
returns trigger
language plpgsql
as $$
declare
  latest_rank_promotion public.member_promotions%rowtype;
begin
  if old.type not in ('stripe', 'belt') then
    return old;
  end if;

  select *
  into latest_rank_promotion
  from public.member_promotions
  where club_id = old.club_id
    and member_id = old.member_id
    and type in ('stripe', 'belt')
  order by awarded_at desc, id desc
  limit 1;

  if found then
    if latest_rank_promotion.type = 'stripe' then
      update public.academy_members
      set
        belt = coalesce(latest_rank_promotion.belt, belt),
        stripes = coalesce(latest_rank_promotion.stripes, stripes)
      where id = old.member_id
        and club_id = old.club_id;
    elsif latest_rank_promotion.type = 'belt' then
      update public.academy_members
      set
        belt = latest_rank_promotion.belt,
        stripes = coalesce(latest_rank_promotion.stripes, 0)
      where id = old.member_id
        and club_id = old.club_id;
    end if;
  elsif old.previous_belt is not null and old.previous_stripes is not null then
    update public.academy_members
    set
      belt = old.previous_belt,
      stripes = old.previous_stripes
    where id = old.member_id
      and club_id = old.club_id;
  end if;

  return old;
end;
$$;

drop trigger if exists prepare_member_promotion_rank on public.member_promotions;
create trigger prepare_member_promotion_rank
before insert on public.member_promotions
for each row
execute function public.prepare_member_promotion_rank();

drop trigger if exists apply_member_promotion_rank on public.member_promotions;
create trigger apply_member_promotion_rank
after insert on public.member_promotions
for each row
execute function public.apply_member_promotion_rank();

drop trigger if exists rollback_deleted_member_promotion_rank on public.member_promotions;
create trigger rollback_deleted_member_promotion_rank
after delete on public.member_promotions
for each row
execute function public.rollback_deleted_member_promotion_rank();
