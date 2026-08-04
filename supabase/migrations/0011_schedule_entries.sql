-- OP Interns — Migration 0011: Simple day-by-day schedule
--
-- Replaces the shift/rotation model (start/end times, shift types, rotations)
-- with a single row per trainee per work day carrying one short activity
-- code — matching the paper-roster format the program actually uses
-- (Sun–Thu, one code per day, no time-of-day concept). The old shifts,
-- shift_assignments, rotations, and rotation_assignments tables are left in
-- place but are no longer written to by the app.

create type schedule_code as enum ('OP1', 'OP2', 'OP3', 'COMP', 'DC', 'CON', 'PPT', 'SURPRISE');

create table public.schedule_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  code schedule_code not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index schedule_entries_user_idx on public.schedule_entries (user_id);
create index schedule_entries_date_idx on public.schedule_entries (date);

create trigger set_updated_at before update on public.schedule_entries
  for each row execute function public.set_updated_at();

alter table public.schedule_entries enable row level security;

create policy "schedule_entries_select" on public.schedule_entries
  for select to authenticated
  using (user_id = auth.uid() or public.is_preceptor_or_admin());

create policy "schedule_entries_write_admin" on public.schedule_entries
  for all to authenticated using (public.is_preceptor_or_admin()) with check (public.is_preceptor_or_admin());
