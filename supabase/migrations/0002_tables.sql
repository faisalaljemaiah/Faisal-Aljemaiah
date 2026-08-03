-- OP Interns — Migration 0002: Core tables

-- ============================================================================
-- PROFILES
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  role user_role not null default 'intern',
  avatar_url text,
  phone text,
  school text,
  cohort text,
  year_level text,
  bio text,
  points integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_points_idx on public.profiles (points desc);

comment on table public.profiles is 'Extended user profile linked 1:1 to auth.users';

-- ============================================================================
-- ROTATIONS & ASSIGNMENTS
-- ============================================================================
create table public.rotations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department text not null,
  description text,
  location text,
  start_date date not null,
  end_date date not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rotation_dates_check check (end_date >= start_date)
);

create index rotations_dates_idx on public.rotations (start_date, end_date);

create table public.rotation_assignments (
  id uuid primary key default gen_random_uuid(),
  rotation_id uuid not null references public.rotations (id) on delete cascade,
  intern_id uuid not null references public.profiles (id) on delete cascade,
  preceptor_id uuid references public.profiles (id) on delete set null,
  start_date date not null,
  end_date date not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (rotation_id, intern_id)
);

create index rotation_assignments_intern_idx on public.rotation_assignments (intern_id);
create index rotation_assignments_preceptor_idx on public.rotation_assignments (preceptor_id);

-- ============================================================================
-- SHIFTS & ATTENDANCE
-- ============================================================================
create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  shift_type text not null default 'clinical',
  rotation_id uuid references public.rotations (id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shift_time_check check (end_time > start_time)
);

create index shifts_start_time_idx on public.shifts (start_time);
create index shifts_rotation_idx on public.shifts (rotation_id);

create table public.shift_assignments (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status shift_status not null default 'scheduled',
  check_in_time timestamptz,
  check_out_time timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shift_id, user_id)
);

create index shift_assignments_user_idx on public.shift_assignments (user_id);
create index shift_assignments_shift_idx on public.shift_assignments (shift_id);
create index shift_assignments_status_idx on public.shift_assignments (status);

-- ============================================================================
-- ANNOUNCEMENTS & NOTIFICATIONS
-- ============================================================================
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  priority announcement_priority not null default 'normal',
  created_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index announcements_published_idx on public.announcements (published_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type notification_type not null default 'system',
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

-- ============================================================================
-- DRUG LOCATOR
-- ============================================================================
create table public.drugs (
  id uuid primary key default gen_random_uuid(),
  generic_name text not null,
  brand_names text[] not null default '{}',
  drug_class text,
  dosage_form text,
  strength text,
  storage_room text not null,
  storage_shelf text,
  storage_bin text,
  is_controlled boolean not null default false,
  is_refrigerated boolean not null default false,
  is_high_alert boolean not null default false,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index drugs_generic_name_idx on public.drugs using gin (generic_name gin_trgm_ops);
create index drugs_brand_names_idx on public.drugs using gin (brand_names);
create index drugs_class_idx on public.drugs (drug_class);

-- ============================================================================
-- DRUG OF THE DAY
-- ============================================================================
create table public.drug_of_day (
  id uuid primary key default gen_random_uuid(),
  drug_name text not null,
  generic_name text,
  drug_class text,
  image_url text,
  mechanism text not null,
  indications text not null,
  contraindications text not null,
  counseling_points text not null,
  publish_date date not null default current_date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (publish_date)
);

create index drug_of_day_publish_date_idx on public.drug_of_day (publish_date desc);

create table public.drug_of_day_questions (
  id uuid primary key default gen_random_uuid(),
  drug_of_day_id uuid not null references public.drug_of_day (id) on delete cascade,
  question text not null,
  choices jsonb not null,
  correct_index smallint not null,
  explanation text,
  order_index smallint not null default 0
);

create index drug_of_day_questions_parent_idx on public.drug_of_day_questions (drug_of_day_id, order_index);

create table public.drug_of_day_completions (
  id uuid primary key default gen_random_uuid(),
  drug_of_day_id uuid not null references public.drug_of_day (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score integer not null default 0,
  total_questions integer not null default 0,
  points_awarded integer not null default 0,
  completed_at timestamptz not null default now(),
  unique (drug_of_day_id, user_id)
);

create index drug_of_day_completions_user_idx on public.drug_of_day_completions (user_id);

-- ============================================================================
-- COUNSELING SIMULATOR
-- ============================================================================
create table public.counseling_cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  patient_name text not null,
  patient_age integer,
  patient_gender text,
  medication text not null,
  scenario text not null,
  difficulty case_difficulty not null default 'beginner',
  learning_objectives text[] not null default '{}',
  key_counseling_points jsonb not null default '[]',
  common_pitfalls text,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index counseling_cases_difficulty_idx on public.counseling_cases (difficulty);
create index counseling_cases_active_idx on public.counseling_cases (is_active);

create table public.counseling_attempts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.counseling_cases (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score integer not null default 0,
  max_score integer not null default 100,
  points_covered jsonb not null default '[]',
  points_missed jsonb not null default '[]',
  feedback text,
  duration_seconds integer,
  points_awarded integer not null default 0,
  completed_at timestamptz not null default now()
);

create index counseling_attempts_user_idx on public.counseling_attempts (user_id);
create index counseling_attempts_case_idx on public.counseling_attempts (case_id);

-- ============================================================================
-- REFLECTIONS
-- ============================================================================
create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  rotation_id uuid references public.rotations (id) on delete set null,
  title text not null,
  content text not null,
  entry_date date not null default current_date,
  status reflection_status not null default 'draft',
  reviewer_id uuid references public.profiles (id) on delete set null,
  reviewer_feedback text,
  reviewed_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reflections_user_idx on public.reflections (user_id, entry_date desc);
create index reflections_status_idx on public.reflections (status);

-- ============================================================================
-- GAMIFICATION: POINTS, BADGES, LEADERBOARD
-- ============================================================================
create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  points integer not null,
  reason text not null,
  source_type text not null,
  source_id uuid,
  created_at timestamptz not null default now()
);

create index points_ledger_user_idx on public.points_ledger (user_id, created_at desc);
create index points_ledger_created_idx on public.points_ledger (created_at desc);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  icon text not null default 'award',
  points_threshold integer,
  created_at timestamptz not null default now()
);

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create index user_badges_user_idx on public.user_badges (user_id);
