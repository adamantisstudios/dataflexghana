export const WRITING_CATEGORIES = [
  "General",
  "CV/Resume",
  "Cover Letter",
  "Business Plan",
  "Other",
] as const

export type WritingCategory = (typeof WRITING_CATEGORIES)[number]

export const WRITING_ORDER_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "delivered",
  "cancelled",
] as const

export type WritingOrderStatus = (typeof WRITING_ORDER_STATUSES)[number]

export const WRITING_ORDER_STATUS_LABELS: Record<WritingOrderStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export type CvFields = {
  target_roles_industries?: string
  extra_cv_info?: string
  linkedin_url?: string
  cv_pages?: string
  languages_spoken?: string
  current_location?: string
  willingness_to_relocate?: string
  valid_drivers_license?: string
}

export type WritingService = {
  id: string
  service_name: string
  description: string | null
  price: number
  agent_commission: number
  turnaround_time: string
  category: WritingCategory
  is_active: boolean
  created_at: string
}

export type PublicWritingService = {
  id: string
  service_name: string
  description: string | null
  price: number
  agent_commission: number
  turnaround_time: string
  category: WritingCategory
}

export type WritingOrder = {
  id: string
  service_id: string | null
  agent_id: string | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  instructions: string | null
  cv_fields: CvFields
  attached_file_url: string | null
  total_paid: number
  paystack_reference: string | null
  status: WritingOrderStatus
  completed_file_url: string | null
  admin_notes: string | null
  agent_commission_earned: number
  commission_credited: boolean
  created_at: string
  writing_services?: WritingService | null
  agents?: { full_name?: string; phone_number?: string } | null
}

export function isWritingCategory(value: string): value is WritingCategory {
  return (WRITING_CATEGORIES as readonly string[]).includes(value)
}

export function isWritingOrderStatus(value: string): value is WritingOrderStatus {
  return (WRITING_ORDER_STATUSES as readonly string[]).includes(value)
}

export function parseCvFields(raw: unknown): CvFields {
  if (!raw || typeof raw !== "object") return {}
  return raw as CvFields
}
