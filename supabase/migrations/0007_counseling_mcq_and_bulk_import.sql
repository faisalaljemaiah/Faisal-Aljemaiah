-- OP Interns — Migration 0007: Counseling Simulator MCQ questions

create table public.counseling_case_questions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.counseling_cases (id) on delete cascade,
  question text not null,
  choices jsonb not null,
  correct_index smallint not null,
  explanation text,
  order_index smallint not null default 0
);

create index counseling_case_questions_case_idx on public.counseling_case_questions (case_id, order_index);

alter table public.counseling_case_questions enable row level security;

create policy "counseling_case_questions_select" on public.counseling_case_questions
  for select to authenticated using (
    exists (
      select 1 from public.counseling_cases c
       where c.id = case_id and (c.is_active or public.is_admin())
    )
  );

create policy "counseling_case_questions_write_admin" on public.counseling_case_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- Extend attempts with MCQ scoring, and replace the scoring RPC to blend
-- checklist completion with MCQ accuracy when both are present on a case.
-- ============================================================================
alter table public.counseling_attempts add column mcq_score integer;
alter table public.counseling_attempts add column mcq_total integer;

create or replace function public.submit_counseling_attempt(
  p_case_id uuid,
  p_covered_point_ids jsonb,
  p_duration_seconds integer,
  p_mcq_answers jsonb default '[]'::jsonb -- [{"question_id": "uuid", "selected_index": 0}, ...]
)
returns public.counseling_attempts
language plpgsql
security definer set search_path = public
as $$
declare
  v_case record;
  v_total_points integer;
  v_covered_count integer;
  v_checklist_score integer;
  v_mcq_total integer;
  v_mcq_correct integer := 0;
  v_mcq_score integer;
  v_final_score integer;
  v_points_awarded integer;
  v_missed jsonb;
  v_answer jsonb;
  v_question record;
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
  v_checklist_score := case when v_total_points = 0 then null else round((v_covered_count::numeric / v_total_points) * 100) end;

  select coalesce(jsonb_agg(pt), '[]'::jsonb) into v_missed
    from jsonb_array_elements(v_case.key_counseling_points) pt
   where not (p_covered_point_ids @> jsonb_build_array(pt ->> 'id'));

  select count(*) into v_mcq_total from public.counseling_case_questions where case_id = p_case_id;

  if v_mcq_total > 0 then
    for v_answer in select * from jsonb_array_elements(p_mcq_answers)
    loop
      select * into v_question
        from public.counseling_case_questions
       where id = (v_answer ->> 'question_id')::uuid
         and case_id = p_case_id;

      if found and v_question.correct_index = (v_answer ->> 'selected_index')::smallint then
        v_mcq_correct := v_mcq_correct + 1;
      end if;
    end loop;
    v_mcq_score := round((v_mcq_correct::numeric / v_mcq_total) * 100);
  else
    v_mcq_score := null;
  end if;

  if v_checklist_score is not null and v_mcq_score is not null then
    v_final_score := round((v_checklist_score + v_mcq_score) / 2.0);
  else
    v_final_score := coalesce(v_checklist_score, v_mcq_score, 0);
  end if;

  v_points_awarded := case v_case.difficulty
    when 'advanced' then round(v_final_score::numeric / 100 * 20)
    when 'intermediate' then round(v_final_score::numeric / 100 * 15)
    else round(v_final_score::numeric / 100 * 10)
  end;

  insert into public.counseling_attempts (
    case_id, user_id, score, max_score, points_covered, points_missed,
    duration_seconds, points_awarded, mcq_score, mcq_total
  ) values (
    p_case_id, auth.uid(), v_final_score, 100, p_covered_point_ids, v_missed,
    p_duration_seconds, v_points_awarded, v_mcq_correct, v_mcq_total
  ) returning * into v_result;

  insert into public.points_ledger (user_id, points, reason, source_type, source_id)
  values (auth.uid(), v_points_awarded, 'Counseling simulator case completed', 'counseling', p_case_id);

  return v_result;
end;
$$;
