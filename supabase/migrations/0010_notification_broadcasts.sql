-- Broadcast in-app notifications for the events that should also trigger an
-- email (wired up separately via a Database Webhook -> Edge Function):
--   - a new Drug of the Day is published
--   - a new counseling case is published
--   - an intern gets a new shift assignment, or an existing shift's time/
--     location changes
--
-- Preceptors are notified platform-wide for all of these (not scoped to
-- their own interns), matching the existing announcement broadcast pattern.

-- ============================================================================
-- Notify everyone when a new Drug of the Day is published
-- ============================================================================
create or replace function public.handle_new_drug_of_day()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  select id, 'drug_of_day', 'New Drug of the Day', new.drug_name || ' has been published.', '/drug-of-the-day'
    from public.profiles
   where is_active = true and (new.created_by is null or id <> new.created_by);
  return new;
end;
$$;

create trigger drug_of_day_after_insert
  after insert on public.drug_of_day
  for each row execute function public.handle_new_drug_of_day();

-- ============================================================================
-- Notify everyone when a new counseling case is published
-- ============================================================================
create or replace function public.handle_new_counseling_case()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.is_active then
    insert into public.notifications (user_id, type, title, body, link)
    select id, 'counseling', 'New counseling case', '"' || new.title || '" has been published.', '/counseling-simulator/' || new.id
      from public.profiles
     where is_active = true and (new.created_by is null or id <> new.created_by);
  end if;
  return new;
end;
$$;

create trigger counseling_cases_after_insert
  after insert on public.counseling_cases
  for each row execute function public.handle_new_counseling_case();

-- ============================================================================
-- Also notify all preceptors when an intern gets a new shift assignment
-- ============================================================================
create or replace function public.handle_new_shift_assignment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_title text;
begin
  select title into v_title from public.shifts where id = new.shift_id;

  insert into public.notifications (user_id, type, title, body, link)
  values (new.user_id, 'shift', 'New shift assigned', coalesce(v_title, 'A shift') || ' has been added to your schedule.', '/schedule');

  insert into public.notifications (user_id, type, title, body, link)
  select id, 'shift', 'New shift assignment',
         coalesce(v_title, 'A shift') || ' was assigned to ' || (select full_name from public.profiles where id = new.user_id) || '.',
         '/admin/schedules'
    from public.profiles
   where is_active = true and role = 'preceptor';

  return new;
end;
$$;

-- ============================================================================
-- Notify the assigned intern(s) and all preceptors when a shift's time or
-- location changes
-- ============================================================================
create or replace function public.handle_shift_updated()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.start_time is distinct from old.start_time
     or new.end_time is distinct from old.end_time
     or new.location is distinct from old.location then

    insert into public.notifications (user_id, type, title, body, link)
    select sa.user_id, 'shift', 'Shift updated', '"' || new.title || '" has been updated. Check your schedule for details.', '/schedule'
      from public.shift_assignments sa
     where sa.shift_id = new.id;

    insert into public.notifications (user_id, type, title, body, link)
    select id, 'shift', 'Shift updated', '"' || new.title || '" has been updated.', '/admin/schedules'
      from public.profiles
     where is_active = true and role = 'preceptor';
  end if;
  return new;
end;
$$;

create trigger shifts_after_update
  after update on public.shifts
  for each row execute function public.handle_shift_updated();
