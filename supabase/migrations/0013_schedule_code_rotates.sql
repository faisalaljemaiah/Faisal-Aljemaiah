-- OP Interns — Migration 0013: Mark which codes count as real rotation sites
--
-- The auto-generate schedule feature fairly rotates trainees through sites
-- like OP1/OP2/OP3 — but "Surprise" isn't a site, so it should never be
-- something the generator hands out on its own.

alter table public.schedule_code_types add column rotates boolean not null default true;

update public.schedule_code_types set rotates = false where code = 'SURPRISE';
