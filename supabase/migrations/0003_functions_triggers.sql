-- OP Interns — Migration 0003: Functions & triggers

-- ============================================================================
-- updated_at maintenance
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.rotations
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.shifts
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.shift_assignments
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.announcements
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.drugs
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.drug_of_day
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.counseling_cases
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.reflections
  for each row execute function public.set_updated_at();

-- ============================================================================
-- New auth user -> profile row
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'intern')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Role-check helpers (security definer to avoid RLS recursion)
-- ============================================================================
create or replace function public.current_user_role()
returns user_role
language sql
security definer set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_preceptor_or_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'preceptor')
  );
$$;

-- ============================================================================
-- Points ledger -> keep profiles.points in sync
-- ============================================================================
create or replace function public.apply_points_ledger_entry()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
     set points = points + new.points
   where id = new.user_id;
  return new;
end;
$$;

create trigger points_ledger_after_insert
  after insert on public.points_ledger
  for each row execute function public.apply_points_ledger_entry();

-- ============================================================================
-- Award badges automatically once a user crosses a points threshold
-- ============================================================================
create or replace function public.check_and_award_badges()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_badges (user_id, badge_id)
  select new.id, b.id
    from public.badges b
   where b.points_threshold is not null
     and new.points >= b.points_threshold
     and not exists (
       select 1 from public.user_badges ub
        where ub.user_id = new.id and ub.badge_id = b.id
     )
  on conflict do nothing;
  return new;
end;
$$;

create trigger profiles_award_badges
  after update of points on public.profiles
  for each row execute function public.check_and_award_badges();

-- ============================================================================
-- Score drug-of-day quiz submission server-side (prevents client tampering)
-- ============================================================================
create or replace function public.submit_drug_of_day_quiz(
  p_drug_of_day_id uuid,
  p_answers jsonb -- [{"question_id": "uuid", "selected_index": 0}, ...]
)
returns public.drug_of_day_completions
language plpgsql
security definer set search_path = public
as $$
declare
  v_total integer;
  v_score integer := 0;
  v_answer jsonb;
  v_question record;
  v_points integer;
  v_result public.drug_of_day_completions;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select count(*) into v_total
    from public.drug_of_day_questions
   where drug_of_day_id = p_drug_of_day_id;

  if v_total = 0 then
    raise exception 'No questions found for this drug of the day';
  end if;

  for v_answer in select * from jsonb_array_elements(p_answers)
  loop
    select * into v_question
      from public.drug_of_day_questions
     where id = (v_answer ->> 'question_id')::uuid
       and drug_of_day_id = p_drug_of_day_id;

    if found and v_question.correct_index = (v_answer ->> 'selected_index')::smallint then
      v_score := v_score + 1;
    end if;
  end loop;

  v_points := round(v_score::numeric / v_total * 10);

  insert into public.drug_of_day_completions (drug_of_day_id, user_id, score, total_questions, points_awarded)
  values (p_drug_of_day_id, auth.uid(), v_score, v_total, v_points)
  on conflict (drug_of_day_id, user_id) do nothing
  returning * into v_result;

  if v_result.id is null then
    -- already completed previously: update the record but do not re-award points
    update public.drug_of_day_completions
       set score = v_score, total_questions = v_total
     where drug_of_day_id = p_drug_of_day_id and user_id = auth.uid()
    returning * into v_result;
  else
    insert into public.points_ledger (user_id, points, reason, source_type, source_id)
    values (auth.uid(), v_points, 'Drug of the Day quiz completed', 'drug_of_day', p_drug_of_day_id);
  end if;

  return v_result;
end;
$$;

-- ============================================================================
-- Score counseling simulator attempt server-side
-- ============================================================================
create or replace function public.submit_counseling_attempt(
  p_case_id uuid,
  p_covered_point_ids jsonb, -- ["point_id", ...] ids matched from key_counseling_points
  p_duration_seconds integer
)
returns public.counseling_attempts
language plpgsql
security definer set search_path = public
as $$
declare
  v_case record;
  v_total_points integer;
  v_covered_count integer;
  v_score integer;
  v_points_awarded integer;
  v_missed jsonb;
  v_result public.counseling_attempts;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_case from public.counseling_cases where id = p_case_id;
  if not found then
    raise exception 'Case not found';
  end if;

  v_total_points := jsonb_array_length(v_case.key_counseling_points);
  v_covered_count := jsonb_array_length(p_covered_point_ids);

  if v_total_points = 0 then
    v_score := 0;
  else
    v_score := round((v_covered_count::numeric / v_total_points) * 100);
  end if;

  select coalesce(jsonb_agg(pt), '[]'::jsonb) into v_missed
    from jsonb_array_elements(v_case.key_counseling_points) pt
   where not (p_covered_point_ids @> jsonb_build_array(pt ->> 'id'));

  v_points_awarded := case v_case.difficulty
    when 'advanced' then round(v_score::numeric / 100 * 20)
    when 'intermediate' then round(v_score::numeric / 100 * 15)
    else round(v_score::numeric / 100 * 10)
  end;

  insert into public.counseling_attempts (
    case_id, user_id, score, max_score, points_covered, points_missed, duration_seconds, points_awarded
  ) values (
    p_case_id, auth.uid(), v_score, 100, p_covered_point_ids, v_missed, p_duration_seconds, v_points_awarded
  ) returning * into v_result;

  insert into public.points_ledger (user_id, points, reason, source_type, source_id)
  values (auth.uid(), v_points_awarded, 'Counseling simulator case completed', 'counseling', p_case_id);

  return v_result;
end;
$$;

-- ============================================================================
-- Reflections: award points + notify on first submission
-- ============================================================================
create or replace function public.handle_reflection_submitted()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'submitted' and (old.status is distinct from 'submitted') then
    new.submitted_at := now();
    insert into public.points_ledger (user_id, points, reason, source_type, source_id)
    values (new.user_id, 5, 'Reflection submitted', 'reflection', new.id);
  end if;

  if new.status = 'reviewed' and (old.status is distinct from 'reviewed') then
    new.reviewed_at := now();
    insert into public.notifications (user_id, type, title, body, link)
    values (new.user_id, 'reflection', 'Reflection reviewed', 'Your reflection "' || new.title || '" has been reviewed.', '/reflections/' || new.id);
  end if;

  return new;
end;
$$;

create trigger reflections_submitted_trigger
  before update on public.reflections
  for each row execute function public.handle_reflection_submitted();

-- ============================================================================
-- Notify assigned user when a shift assignment is created
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
  return new;
end;
$$;

create trigger shift_assignments_after_insert
  after insert on public.shift_assignments
  for each row execute function public.handle_new_shift_assignment();

-- ============================================================================
-- Notify all active users when an announcement is published
-- ============================================================================
create or replace function public.handle_new_announcement()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  select id, 'announcement', new.title, left(new.body, 140), '/announcements'
    from public.profiles
   where is_active = true and id <> new.created_by;
  return new;
end;
$$;

create trigger announcements_after_insert
  after insert on public.announcements
  for each row execute function public.handle_new_announcement();

-- ============================================================================
-- Leaderboard views
-- ============================================================================
create or replace view public.leaderboard_all_time as
select
  p.id as user_id,
  p.full_name,
  p.avatar_url,
  p.role,
  p.points,
  rank() over (order by p.points desc) as rank
from public.profiles p
where p.role = 'intern' and p.is_active = true;

create or replace view public.leaderboard_weekly as
select
  p.id as user_id,
  p.full_name,
  p.avatar_url,
  p.role,
  coalesce(sum(pl.points), 0) as points,
  rank() over (order by coalesce(sum(pl.points), 0) desc) as rank
from public.profiles p
left join public.points_ledger pl
  on pl.user_id = p.id and pl.created_at >= date_trunc('week', now())
where p.role = 'intern' and p.is_active = true
group by p.id, p.full_name, p.avatar_url, p.role;

create or replace view public.leaderboard_monthly as
select
  p.id as user_id,
  p.full_name,
  p.avatar_url,
  p.role,
  coalesce(sum(pl.points), 0) as points,
  rank() over (order by coalesce(sum(pl.points), 0) desc) as rank
from public.profiles p
left join public.points_ledger pl
  on pl.user_id = p.id and pl.created_at >= date_trunc('month', now())
where p.role = 'intern' and p.is_active = true
group by p.id, p.full_name, p.avatar_url, p.role;
