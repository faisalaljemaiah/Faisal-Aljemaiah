import type { MedicationCategory } from '@/types/database'

export const MEDICATION_CATEGORIES: { value: MedicationCategory; label: string }[] = [
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'oncology', label: 'Oncology' },
  { value: 'cns', label: 'CNS' },
  { value: 'gastrointestinal', label: 'Gastrointestinal' },
  { value: 'endocrine', label: 'Endocrine' },
  { value: 'infectious_diseases', label: 'Infectious Diseases' },
  { value: 'otc', label: 'OTC' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'antibiotics', label: 'Antibiotics' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'respiratory', label: 'Respiratory' },
  { value: 'renal', label: 'Renal' },
  { value: 'hematology', label: 'Hematology' },
  { value: 'psychiatry', label: 'Psychiatry' },
  { value: 'other', label: 'Other' },
]

export function categoryLabel(value: MedicationCategory | null | undefined) {
  return MEDICATION_CATEGORIES.find((c) => c.value === value)?.label ?? '—'
}
