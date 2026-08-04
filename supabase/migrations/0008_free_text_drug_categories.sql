-- OP Interns — Migration 0008: Make drug categories free text
--
-- Real pharmacies organize medications by their own zone/category naming
-- (e.g. "Cardiovascular", "Topicals", "Inhaler", "Eye/Ear") rather than a
-- fixed list we invented. Switch `drugs.category` from a rigid enum to
-- free text so bulk imports can carry whatever taxonomy a pharmacy
-- actually uses; the UI now suggests common values via autocomplete
-- while deriving the real filter list from existing data.

alter table public.drugs alter column category type text using category::text;
drop type if exists medication_category;
