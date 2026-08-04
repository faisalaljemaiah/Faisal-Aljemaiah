export type UserRole = 'admin' | 'preceptor' | 'intern'

export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent'

export type ReflectionStatus = 'draft' | 'submitted' | 'reviewed'

export type CaseDifficulty = 'beginner' | 'intermediate' | 'advanced'

export type NotificationType =
  | 'shift'
  | 'announcement'
  | 'drug_of_day'
  | 'reflection'
  | 'counseling'
  | 'badge'
  | 'system'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  phone: string | null
  school: string | null
  cohort: string | null
  year_level: string | null
  bio: string | null
  points: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ScheduleEntry {
  id: string
  user_id: string
  date: string
  code: string
  created_by: string | null
  created_at: string
  updated_at: string
  user?: Profile
}

export interface ScheduleCodeType {
  code: string
  short_label: string
  label: string
  color: string
  sort_order: number
  created_by: string | null
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  priority: AnnouncementPriority
  created_by: string | null
  published_at: string
  expires_at: string | null
  created_at: string
  updated_at: string
  author?: Profile
}

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

/** Free text — pharmacies use their own zone/category naming, so this isn't a fixed enum. */
export type MedicationCategory = string

export interface Drug {
  id: string
  generic_name: string
  brand_names: string[]
  drug_class: string | null
  category: MedicationCategory | null
  dosage_form: string | null
  strength: string | null
  storage_room: string
  storage_shelf: string | null
  storage_bin: string | null
  is_controlled: boolean
  is_refrigerated: boolean
  is_high_alert: boolean
  image_urls: string[]
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DrugOfDay {
  id: string
  drug_name: string
  generic_name: string | null
  drug_class: string | null
  image_url: string | null
  mechanism: string
  indications: string
  contraindications: string
  counseling_points: string
  publish_date: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DrugOfDayQuestion {
  id: string
  drug_of_day_id: string
  question: string
  choices: string[]
  correct_index: number
  explanation: string | null
  order_index: number
}

export interface DrugOfDayCompletion {
  id: string
  drug_of_day_id: string
  user_id: string
  score: number
  total_questions: number
  points_awarded: number
  completed_at: string
}

export interface CounselingKeyPoint {
  id: string
  label: string
  detail: string
}

export interface CounselingCase {
  id: string
  title: string
  patient_name: string
  patient_age: number | null
  patient_gender: string | null
  medication: string
  scenario: string
  difficulty: CaseDifficulty
  learning_objectives: string[]
  key_counseling_points: CounselingKeyPoint[]
  common_pitfalls: string | null
  is_active: boolean
  generated_by_ai: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CounselingCaseQuestion {
  id: string
  case_id: string
  question: string
  choices: string[]
  correct_index: number
  explanation: string | null
  order_index: number
}

export interface CounselingAttempt {
  id: string
  case_id: string
  user_id: string
  score: number
  max_score: number
  points_covered: string[]
  points_missed: CounselingKeyPoint[]
  feedback: string | null
  duration_seconds: number | null
  points_awarded: number
  mcq_score: number | null
  mcq_total: number | null
  completed_at: string
  case?: CounselingCase
}

export interface Reflection {
  id: string
  user_id: string
  rotation_id: string | null
  title: string
  content: string
  entry_date: string
  status: ReflectionStatus
  reviewer_id: string | null
  reviewer_feedback: string | null
  reviewed_at: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
  author?: Profile
  reviewer?: Profile
}

export interface PointsLedgerEntry {
  id: string
  user_id: string
  points: number
  reason: string
  source_type: string
  source_id: string | null
  created_at: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  points_threshold: number | null
  created_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  awarded_at: string
  badge?: Badge
}

export interface LeaderboardRow {
  user_id: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  points: number
  rank: number
}
