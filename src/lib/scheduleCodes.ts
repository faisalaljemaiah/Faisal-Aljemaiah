// A fixed palette of pre-written Tailwind classes an admin picks a schedule
// code's color from. Deliberately not built from a dynamic string like
// `bg-${color}-100` — Tailwind only generates CSS for class names it can see
// literally in the source, so free-form color names wouldn't render.
export type ScheduleColorKey =
  | 'slate'
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'teal'
  | 'cyan'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'pink'
  | 'rose'
  | 'orange-outline'

interface ScheduleColorStyle {
  name: string
  cell: string
  swatch: string
}

export const SCHEDULE_COLOR_PALETTE: Record<ScheduleColorKey, ScheduleColorStyle> = {
  slate: {
    name: 'Slate',
    cell: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300',
    swatch: 'bg-slate-200 dark:bg-slate-700',
  },
  red: {
    name: 'Red',
    cell: 'border-red-300 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300',
    swatch: 'bg-red-300 dark:bg-red-800',
  },
  orange: {
    name: 'Orange',
    cell: 'border-orange-300 bg-orange-100 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300',
    swatch: 'bg-orange-300 dark:bg-orange-800',
  },
  amber: {
    name: 'Amber',
    cell: 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    swatch: 'bg-amber-300 dark:bg-amber-800',
  },
  yellow: {
    name: 'Yellow',
    cell: 'border-yellow-300 bg-yellow-100 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300',
    swatch: 'bg-yellow-300 dark:bg-yellow-800',
  },
  lime: {
    name: 'Lime',
    cell: 'border-lime-300 bg-lime-100 text-lime-800 dark:border-lime-800 dark:bg-lime-950/40 dark:text-lime-300',
    swatch: 'bg-lime-300 dark:bg-lime-800',
  },
  green: {
    name: 'Green',
    cell: 'border-green-300 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300',
    swatch: 'bg-green-300 dark:bg-green-800',
  },
  teal: {
    name: 'Teal',
    cell: 'border-teal-300 bg-teal-100 text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300',
    swatch: 'bg-teal-300 dark:bg-teal-800',
  },
  cyan: {
    name: 'Cyan',
    cell: 'border-cyan-300 bg-cyan-100 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300',
    swatch: 'bg-cyan-300 dark:bg-cyan-800',
  },
  blue: {
    name: 'Blue',
    cell: 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    swatch: 'bg-blue-300 dark:bg-blue-800',
  },
  indigo: {
    name: 'Indigo',
    cell: 'border-indigo-300 bg-indigo-100 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300',
    swatch: 'bg-indigo-300 dark:bg-indigo-800',
  },
  violet: {
    name: 'Violet',
    cell: 'border-violet-300 bg-violet-100 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
    swatch: 'bg-violet-300 dark:bg-violet-800',
  },
  purple: {
    name: 'Purple',
    cell: 'border-purple-300 bg-purple-100 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
    swatch: 'bg-purple-300 dark:bg-purple-800',
  },
  pink: {
    name: 'Pink',
    cell: 'border-pink-300 bg-pink-100 text-pink-700 dark:border-pink-800 dark:bg-pink-950/40 dark:text-pink-300',
    swatch: 'bg-pink-300 dark:bg-pink-800',
  },
  rose: {
    name: 'Rose',
    cell: 'border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
    swatch: 'bg-rose-300 dark:bg-rose-800',
  },
  'orange-outline': {
    name: 'Outlined',
    cell: 'border-2 border-orange-400 bg-white text-orange-500 font-bold dark:bg-transparent dark:text-orange-400',
    swatch: 'border-2 border-orange-400 bg-white dark:bg-transparent',
  },
}

export function scheduleCellClasses(color: string): string {
  return SCHEDULE_COLOR_PALETTE[color as ScheduleColorKey]?.cell ?? SCHEDULE_COLOR_PALETTE.slate.cell
}

export function scheduleSwatchClasses(color: string): string {
  return SCHEDULE_COLOR_PALETTE[color as ScheduleColorKey]?.swatch ?? SCHEDULE_COLOR_PALETTE.slate.swatch
}
