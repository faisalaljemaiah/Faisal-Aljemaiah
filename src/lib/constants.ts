/**
 * Suggested categories shown as autocomplete hints when adding a medication.
 * Categories are free text (see MedicationCategory) — the real filter list on
 * the Drug Locator is derived from whatever values actually exist in the
 * data, so a pharmacy's own zone naming (e.g. "Cardiovascular", "Topicals")
 * works without any code changes.
 */
export const SUGGESTED_MEDICATION_CATEGORIES = [
  'Cardiology',
  'Oncology',
  'CNS',
  'Gastrointestinal',
  'Endocrine',
  'Infectious Diseases',
  'OTC',
  'Emergency',
  'Antibiotics',
  'Pediatrics',
  'Respiratory',
  'Renal',
  'Hematology',
  'Psychiatry',
  'Topicals',
  'Eye/Ear',
  'Other',
]

/**
 * The hospital's three physical outpatient pharmacies. Fixed set (unlike
 * category above) — every medication in the locator belongs to at most one
 * of these, so it's a real enum in the database (see migration 0014).
 */
export const OP_SITES = ['OP1', 'OP2', 'OP3'] as const

export const OP_SITE_COLORS: Record<(typeof OP_SITES)[number], { badge: string; tab: string }> = {
  OP1: {
    badge: 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    tab: 'data-[state=active]:bg-blue-600 data-[state=active]:text-white',
  },
  OP2: {
    badge:
      'border-violet-300 bg-violet-100 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
    tab: 'data-[state=active]:bg-violet-600 data-[state=active]:text-white',
  },
  OP3: {
    badge:
      'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    tab: 'data-[state=active]:bg-amber-600 data-[state=active]:text-white',
  },
}
