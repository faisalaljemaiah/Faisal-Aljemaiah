-- OP Interns — Migration 0014: Which outpatient pharmacy stocks a medication
--
-- The hospital runs three physical outpatient pharmacies (OP1, OP2, OP3).
-- Unlike `category` (a free-text clinical zone naming that varies per site,
-- see migration 0008), the three OP sites are a fixed, known set for this
-- hospital, so this is a real enum — same pattern as `schedule_code`.

create type public.op_site as enum ('OP1', 'OP2', 'OP3');

alter table public.drugs add column op_site public.op_site;

create index drugs_op_site_idx on public.drugs (op_site);
