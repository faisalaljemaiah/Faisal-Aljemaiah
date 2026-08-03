-- OP Interns — Migration 0006: Medication categories, images, and storage bucket

create type medication_category as enum (
  'cardiology',
  'oncology',
  'cns',
  'gastrointestinal',
  'endocrine',
  'infectious_diseases',
  'otc',
  'emergency',
  'antibiotics',
  'pediatrics',
  'respiratory',
  'renal',
  'hematology',
  'psychiatry',
  'other'
);

alter table public.drugs add column category medication_category;
alter table public.drugs add column image_urls text[] not null default '{}';

create index drugs_category_idx on public.drugs (category);

-- ============================================================================
-- Storage bucket for medication images
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('medication-images', 'medication-images', true)
on conflict (id) do nothing;

create policy "medication_images_select_all" on storage.objects
  for select to authenticated
  using (bucket_id = 'medication-images');

create policy "medication_images_write_admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'medication-images' and public.is_preceptor_or_admin());

create policy "medication_images_update_admin" on storage.objects
  for update to authenticated
  using (bucket_id = 'medication-images' and public.is_preceptor_or_admin());

create policy "medication_images_delete_admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'medication-images' and public.is_preceptor_or_admin());
