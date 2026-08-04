import type { ScheduleCode } from '@/types/database'

interface ScheduleCodeMeta {
  label: string
  cell: string
  swatch: string
}

// Matches the paper roster the program already runs on — a fixed set of
// short activity codes, one per trainee per work day.
export const SCHEDULE_CODES: ScheduleCode[] = ['OP1', 'OP2', 'OP3', 'COMP', 'DC', 'CON', 'PPT', 'SURPRISE']

export const scheduleCodeMeta: Record<ScheduleCode, ScheduleCodeMeta> = {
  OP1: {
    label: 'Main Ambulatory Floor',
    cell: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300',
    swatch: 'bg-slate-200 dark:bg-slate-700',
  },
  OP2: {
    label: 'Oncology',
    cell: 'border-violet-300 bg-violet-100 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
    swatch: 'bg-violet-300 dark:bg-violet-800',
  },
  OP3: {
    label: 'Family Medicine',
    cell: 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    swatch: 'bg-blue-300 dark:bg-blue-800',
  },
  COMP: {
    label: 'Compounding',
    cell: 'border-teal-300 bg-teal-100 text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300',
    swatch: 'bg-teal-300 dark:bg-teal-800',
  },
  DC: {
    label: 'Discharge (x2)',
    cell: 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    swatch: 'bg-amber-300 dark:bg-amber-800',
  },
  CON: {
    label: 'Counselling',
    cell: 'border-green-300 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300',
    swatch: 'bg-green-300 dark:bg-green-800',
  },
  PPT: {
    label: 'Presentation',
    cell: 'border-pink-300 bg-pink-100 text-pink-700 dark:border-pink-800 dark:bg-pink-950/40 dark:text-pink-300',
    swatch: 'bg-pink-300 dark:bg-pink-800',
  },
  SURPRISE: {
    label: 'Surprise',
    cell: 'border-2 border-orange-400 bg-white text-orange-500 font-bold dark:bg-transparent dark:text-orange-400',
    swatch: 'border-2 border-orange-400 bg-white dark:bg-transparent',
  },
}

export function scheduleCodeText(code: ScheduleCode): string {
  return code === 'SURPRISE' ? '?' : code
}
