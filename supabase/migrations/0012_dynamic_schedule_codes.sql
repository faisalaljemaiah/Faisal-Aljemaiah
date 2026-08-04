-- OP Interns — Migration 0012: Admin-editable schedule activity codes
--
-- The OP1/OP2/.../Surprise codes were a fixed enum, meaning the program
-- couldn't add or retire a code without a code change. Replaces that with a
-- schedule_code_types table admins manage directly, and points
-- schedule_entries.code at it instead of the enum.

create table public.schedule_code_types (
  code text primary key,
  short_label text not null,
  label text not null,
  color text not null,
  sort_order integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

insert into public.schedule_code_types (code, short_label, label, color, sort_order) values
  ('OP1', 'OP1', 'Main Ambulatory Floor', 'slate', 1),
  ('OP2', 'OP2', 'Oncology', 'violet', 2),
  ('OP3', 'OP3', 'Family Medicine', 'blue', 3),
  ('COMP', 'COMP', 'Compounding', 'teal', 4),
  ('DC', 'DC', 'Discharge (x2)', 'amber', 5),
  ('CON', 'CON', 'Counselling', 'green', 6),
  ('PPT', 'PPT', 'Presentation', 'pink', 7),
  ('SURPRISE', '?', 'Surprise', 'orange-outline', 8);

alter table public.schedule_entries alter column code type text using code::text;

alter table public.schedule_entries
  add constraint schedule_entries_code_fkey foreign key (code)
  references public.schedule_code_types (code) on delete restrict on update cascade;

alter table public.schedule_code_types enable row level security;

create policy "schedule_code_types_select_all" on public.schedule_code_types
  for select to authenticated using (true);

create policy "schedule_code_types_write_admin" on public.schedule_code_types
  for all to authenticated using (public.is_preceptor_or_admin()) with check (public.is_preceptor_or_admin());
