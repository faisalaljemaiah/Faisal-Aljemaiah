// A distinct accent color per feature area, in the spirit of Notion/Linear
// sidebars — each icon reads as its own section rather than a wall of one
// brand color. Kept soft (50/950 tints) so it layers on the clinical-white
// base instead of fighting it.
export type FeatureColorKey =
  | 'home'
  | 'schedule'
  | 'drugOfDay'
  | 'drugLocator'
  | 'counseling'
  | 'reflections'
  | 'leaderboard'
  | 'announcements'
  | 'admin'

interface FeatureColor {
  icon: string
  chip: string
  activeChip: string
}

export const featureColors: Record<FeatureColorKey, FeatureColor> = {
  home: {
    icon: 'text-primary',
    chip: 'bg-secondary text-secondary-foreground',
    activeChip: 'bg-secondary text-secondary-foreground',
  },
  schedule: {
    icon: 'text-blue-600 dark:text-blue-400',
    chip: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    activeChip: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  },
  drugOfDay: {
    icon: 'text-orange-600 dark:text-orange-400',
    chip: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
    activeChip: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
  },
  drugLocator: {
    icon: 'text-cyan-600 dark:text-cyan-400',
    chip: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400',
    activeChip: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
  },
  counseling: {
    icon: 'text-violet-600 dark:text-violet-400',
    chip: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
    activeChip: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
  },
  reflections: {
    icon: 'text-rose-600 dark:text-rose-400',
    chip: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    activeChip: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  },
  leaderboard: {
    icon: 'text-amber-600 dark:text-amber-400',
    chip: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    activeChip: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  },
  announcements: {
    icon: 'text-indigo-600 dark:text-indigo-400',
    chip: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    activeChip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
  },
  admin: {
    icon: 'text-slate-600 dark:text-slate-400',
    chip: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300',
    activeChip: 'bg-slate-200 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200',
  },
}
