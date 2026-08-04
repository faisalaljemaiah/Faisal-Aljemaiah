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
