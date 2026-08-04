-- Marks counseling cases that were generated automatically by the daily
-- AI case generator, so admins and interns can tell them apart from
-- cases a real pharmacist wrote.
alter table public.counseling_cases
  add column generated_by_ai boolean not null default false;
