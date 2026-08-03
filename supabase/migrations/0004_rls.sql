-- OP Interns — Migration 0004: Row Level Security

alter view public.leaderboard_all_time set (security_invoker = on);
alter view public.leaderboard_weekly set (security_invoker = on);
alter view public.leaderboard_monthly set (security_invoker = on);

alter table public.profiles enable row level security;
alter table public.rotations enable row level security;
alter table public.rotation_assignments enable row level security;
alter table public.shifts enable row level security;
alter table public.shift_assignments enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.drugs enable row level security;
alter table public.drug_of_day enable row level security;
alter table public.drug_of_day_questions enable row level security;
alter table public.drug_of_day_completions enable row level security;
alter table public.counseling_cases enable row level security;
alter table public.counseling_attempts enable row level security;
alter table public.reflections enable row level security;
alter table public.points_ledger enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

-- ============================================================================
-- PROFILES — everyone (authenticated) can view; users manage their own row;
-- admins manage all.
-- ============================================================================
create policy "profiles_select_all" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_update_admin" on public.profiles
  for update to authenticated using (public.is_admin());

create policy "profiles_insert_admin" on public.profiles
  for insert to authenticated with check (public.is_admin());

-- ============================================================================
-- ROTATIONS
-- ============================================================================
create policy "rotations_select_all" on public.rotations
  for select to authenticated using (true);

create policy "rotations_write_admin" on public.rotations
  for all to authenticated using (public.is_preceptor_or_admin()) with check (public.is_preceptor_or_admin());

-- ============================================================================
-- ROTATION ASSIGNMENTS
-- ============================================================================
create policy "rotation_assignments_select" on public.rotation_assignments
  for select to authenticated
  using (intern_id = auth.uid() or preceptor_id = auth.uid() or public.is_admin());

create policy "rotation_assignments_write_admin" on public.rotation_assignments
  for all to authenticated using (public.is_preceptor_or_admin()) with check (public.is_preceptor_or_admin());

-- ============================================================================
-- SHIFTS
-- ============================================================================
create policy "shifts_select_all" on public.shifts
  for select to authenticated using (true);

create policy "shifts_write_admin" on public.shifts
  for all to authenticated using (public.is_preceptor_or_admin()) with check (public.is_preceptor_or_admin());

-- ============================================================================
-- SHIFT ASSIGNMENTS — user sees their own, staff sees all; user may update
-- their own row (check-in/out, status); staff manage everything.
-- ============================================================================
create policy "shift_assignments_select" on public.shift_assignments
  for select to authenticated
  using (user_id = auth.uid() or public.is_preceptor_or_admin());

create policy "shift_assignments_update_own" on public.shift_assignments
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "shift_assignments_write_admin" on public.shift_assignments
  for all to authenticated using (public.is_preceptor_or_admin()) with check (public.is_preceptor_or_admin());

-- ============================================================================
-- ANNOUNCEMENTS
-- ============================================================================
create policy "announcements_select_all" on public.announcements
  for select to authenticated using (true);

create policy "announcements_write_admin" on public.announcements
  for all to authenticated using (public.is_preceptor_or_admin()) with check (public.is_preceptor_or_admin());

-- ============================================================================
-- NOTIFICATIONS — strictly private to the owning user
-- ============================================================================
create policy "notifications_select_own" on public.notifications
  for select to authenticated using (user_id = auth.uid());

create policy "notifications_update_own" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "notifications_delete_own" on public.notifications
  for delete to authenticated using (user_id = auth.uid());

-- ============================================================================
-- DRUG LOCATOR — readable by all, editable by admin/preceptor
-- ============================================================================
create policy "drugs_select_all" on public.drugs
  for select to authenticated using (true);

create policy "drugs_write_admin" on public.drugs
  for all to authenticated using (public.is_preceptor_or_admin()) with check (public.is_preceptor_or_admin());

-- ============================================================================
-- DRUG OF THE DAY — published entries readable by everyone; admins manage
-- ============================================================================
create policy "drug_of_day_select" on public.drug_of_day
  for select to authenticated using (publish_date <= current_date or public.is_admin());

create policy "drug_of_day_write_admin" on public.drug_of_day
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "drug_of_day_questions_select" on public.drug_of_day_questions
  for select to authenticated using (
    exists (
      select 1 from public.drug_of_day d
       where d.id = drug_of_day_id and (d.publish_date <= current_date or public.is_admin())
    )
  );

create policy "drug_of_day_questions_write_admin" on public.drug_of_day_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "drug_of_day_completions_select" on public.drug_of_day_completions
  for select to authenticated using (user_id = auth.uid() or public.is_preceptor_or_admin());

create policy "drug_of_day_completions_insert_own" on public.drug_of_day_completions
  for insert to authenticated with check (user_id = auth.uid());

create policy "drug_of_day_completions_update_own" on public.drug_of_day_completions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- COUNSELING SIMULATOR
-- ============================================================================
create policy "counseling_cases_select" on public.counseling_cases
  for select to authenticated using (is_active or public.is_admin());

create policy "counseling_cases_write_admin" on public.counseling_cases
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "counseling_attempts_select" on public.counseling_attempts
  for select to authenticated using (user_id = auth.uid() or public.is_preceptor_or_admin());

create policy "counseling_attempts_insert_own" on public.counseling_attempts
  for insert to authenticated with check (user_id = auth.uid());

-- ============================================================================
-- REFLECTIONS — owner manages own drafts/submissions; staff can view + review
-- ============================================================================
create policy "reflections_select" on public.reflections
  for select to authenticated using (user_id = auth.uid() or public.is_preceptor_or_admin());

create policy "reflections_insert_own" on public.reflections
  for insert to authenticated with check (user_id = auth.uid());

create policy "reflections_update_own" on public.reflections
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "reflections_update_reviewer" on public.reflections
  for update to authenticated using (public.is_preceptor_or_admin()) with check (public.is_preceptor_or_admin());

create policy "reflections_delete_own_draft" on public.reflections
  for delete to authenticated using (user_id = auth.uid() and status = 'draft');

-- ============================================================================
-- POINTS LEDGER — readable by all (gamification, needed for leaderboard);
-- writes only via security-definer functions/triggers (no direct insert policy
-- for regular users beyond admin adjustments).
-- ============================================================================
create policy "points_ledger_select_all" on public.points_ledger
  for select to authenticated using (true);

create policy "points_ledger_insert_admin" on public.points_ledger
  for insert to authenticated with check (public.is_admin());

-- ============================================================================
-- BADGES
-- ============================================================================
create policy "badges_select_all" on public.badges
  for select to authenticated using (true);

create policy "badges_write_admin" on public.badges
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "user_badges_select_all" on public.user_badges
  for select to authenticated using (true);

create policy "user_badges_write_admin" on public.user_badges
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
