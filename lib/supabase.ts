import { getCalculatedCommission, calculateCommissionWithCaps } from "./commission-calculation"
import { supabase } from "./supabase-base"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Main Supabase client export
 * 
 * ⚠️ IMPORTANT: This imports the SINGLETON client from supabase-base.ts
 * DO NOT create new Supabase clients in other files.
 * Always use this import: import { supabase } from '@/lib/supabase'
 * 
 * This ensures:
 * - Only ONE client instance exists (saves runtime cost)
 * - No GoTrueClient warnings about multiple instances
 * - Consistent auth state across the entire application
 */

// Re-export the singleton directly
export { supabase }

// Types
export interface Agent {
  id: string
  full_name: string
  phone_number: string
  momo_number: string
  region: string
  password_hash?: string
  isapproved: boolean
  wallet_balance?: number
  commission?: number
  created_at: string
  data_orders_count_7d?: number
  data_orders_count_30d?: number
  last_activity_at?: string
  auto_deactivation_reason?: string
  auto_deactivated_at?: string
  referral_id?: string
  can_publish_products?: boolean
  can_update_products?: boolean
  can_publish_properties?: boolean
  can_update_properties?: boolean
}
export interface Service {
  id: string
  title: string
  description: string
  commission_amount: number
  product_cost?: number
  service_type?: "referral" | "data_bundle"
  materials_link?: string
  image_url?: string
  image_urls?: string[]
  created_at: string
}
export interface DataBundle {
  id: string
  name: string
  provider: "MTN" | "AirtelTigo" | "Telecel"
  size_gb: number
  price: number
  validity_months: number
  image_url?: string
  is_active: boolean
  created_at: string
  commission_rate: number // Stored as a decimal (e.g., 0.01 for 1%)
}
export interface DataOrder {
  id: string
  agent_id: string
  bundle_id: string
  recipient_phone: string
  payment_reference: string
  payment_method: "manual" | "wallet"
  status: "pending" | "confirmed" | "processing" | "completed" | "canceled"
  admin_notes?: string
  admin_message?: string
  commission_amount: number
  commission_paid: boolean
  created_at: string
  updated_at: string
  agents?: Agent
  data_bundles?: DataBundle
}
export interface DataOrderNote {
  id: string
  order_id: string
  note_text: string
  original_note?: string
  is_edited: boolean
  created_by: string
  created_at: string
  edited_at?: string
}
export interface Referral {
  id: string
  agent_id: string
  service_id: string
  client_name: string
  client_phone: string
  description: string
  allow_direct_contact?: boolean
  status: "pending" | "confirmed" | "in_progress" | "completed" | "rejected"
  commission_paid: boolean
  created_at: string
  agents?: Agent
  services?: Service
}
export interface ProjectChat {
  id: string
  referral_id: string
  sender_type: "admin" | "agent"
  sender_id: string
  message_type: "text" | "image"
  message_content: string
  timestamp: string
}
export interface Withdrawal {
  id: string
  agent_id: string
  amount: number
  status: "requested" | "processing" | "paid" | "rejected" | "earned"
  momo_number: string
  requested_at: string
  paid_at?: string
  processing_at?: string
  rejected_at?: string
  admin_notes?: string
  created_at: string
  updated_at: string
  // New payout tracking fields
  payout_id?: string
  commission_source_type?: "referral" | "data_order" | "wholesale_order"
  commission_source_id?: string
  is_locked?: boolean
  locked_at?: string
  locked_by?: string
  agents?: Agent
  commission_items?: Array<{ type: string; id: string; product_id?: string; amount: number }> // Updated structure
  commission_sources?: Array<{
    type: "referral" | "data_order" | "wholesale_order"
    id: string
    name: string
    amount: number
    created_at: string
  }>
}
export interface Commission {
  id: string
  agent_id: string
  source_type: "referral" | "data_order" | "wholesale_order"
  source_id: string
  amount: number
  status: "earned" | "pending_withdrawal" | "withdrawn"
  earned_at: string
  withdrawal_id?: string
  withdrawn_at?: string
  created_at: string
  updated_at: string
}
export interface WalletTransaction {
  id: string
  agent_id: string
  transaction_type:
    | "topup"
    | "deduction"
    | "refund"
    | "commission_deposit"
    | "withdrawal_deduction"
    | "admin_reversal"
    | "admin_adjustment"
  amount: number
  reference_code: string
  description: string
  status: "pending" | "approved" | "rejected"
  payment_method: "manual" | "auto"
  admin_notes?: string
  admin_id?: string
  created_at: string
  approved_at?: string
  rejected_at?: string
  agents?: Agent
}

// Compliance System Types
export interface ComplianceForm {
  id: string
  form_name: string
  form_description: string
  form_type: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FormSubmission {
  id: string
  agent_id: string
  form_id: string // This is TEXT, not UUID
  form_data: any
  status: string
  submitted_at: string
  created_at: string
  updated_at: string
}

export interface FormImage {
  id: string
  submission_id: string
  image_url: string
  uploaded_at: string
}

export interface FormStatus {
  id: string
  submission_id: string
  status: string
  changed_at: string
}

export interface ComplianceChat {
  id: string
  submission_id: string
  sender: string
  message: string
  sent_at: string
}

// Job Board Types
export interface Job {
  id: string
  job_title: string
  industry: string
  description: string
  application_deadline: string
  location: string
  salary_type: "negotiable" | "fixed_range" | "exact_amount"
  salary_min?: number
  salary_max?: number
  salary_exact?: number
  salary_currency: string
  employer_name: string
  application_method: "email" | "hyperlink"
  application_contact: string
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
  created_by?: string
}
export const JOB_INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Marketing",
  "Sales",
  "Customer Service",
  "Human Resources",
  "Operations",
  "Construction",
  "Manufacturing",
  "Retail",
  "Hospitality",
  "Transportation",
  "Agriculture",
  "Government",
  "Non-Profit",
  "Other",
] as const
export type JobIndustry = (typeof JOB_INDUSTRIES)[number]

// Utility function to hash passwords (simple implementation)
export const hashPassword = async (password: string): Promise<string> => {
  // In production, use bcrypt or similar
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "dataflex_salt")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  // Try with the current salt (DataFlex)
  const hashedInputCurrent = await hashPassword(password) // This uses "dataflex_salt"
  if (hashedInputCurrent === hash) {
    return true
  }
  // Try with the old salt (TrustReach) for backward compatibility
  const encoder = new TextEncoder()
  const dataOldSalt = encoder.encode(password + "trustreach_salt")
  const hashBufferOldSalt = await crypto.subtle.digest("SHA-256", dataOldSalt)
  const hashArrayOldSalt = Array.from(new Uint8Array(hashBufferOldSalt))
  const hashedInputOld = hashArrayOldSalt.map((b) => b.toString(16).padStart(2, "0")).join("")
  if (hashedInputOld === hash) {
    return true
  }
  return false
}

const generatePaymentReference = (): string => {
  const characters = "0123456789"
  let result = ""
  for (let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

const calculateDataBundleCommission = (bundlePrice: number, commissionRate: number): number => {
  return getCalculatedCommission(bundlePrice, commissionRate)
}

const calculatePreciseCommission = (
  price: number,
  commissionRate: number,
): { isValid: boolean; commission?: number; error?: string } => {
  // Validate inputs
  if (isNaN(price) || price < 0) {
    return { isValid: false, error: "Invalid price value" }
  }

  if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 1) {
    return { isValid: false, error: "Invalid commission rate" }
  }

  try {
    const result = calculateCommissionWithCaps({
      orderAmount: price,
      commissionRate: commissionRate,
    })

    return { isValid: true, commission: result.cappedCommission }
  } catch (error) {
    return { isValid: false, error: "Failed to calculate commission" }
  }
}

const formatCommissionRate = (
  rate: number,
  options: {
    asPercentage?: boolean
    decimalPlaces?: number
  } = {},
): string => {
  const { asPercentage = true, decimalPlaces = 4 } = options
  if (asPercentage) {
    return `${(rate * 100).toFixed(decimalPlaces)}%`
  }
  return rate.toFixed(decimalPlaces)
}

const validateCommissionRate = (
  rate: string | number,
): {
  isValid: boolean
  numericValue?: number
  error?: string
} => {
  let numericRate: number
  if (typeof rate === "string") {
    numericRate = Number.parseFloat(rate)
  } else {
    numericRate = rate
  }
  if (isNaN(numericRate)) {
    return { isValid: false, error: "Commission rate must be a valid number" }
  }
  if (numericRate < 0) {
    return { isValid: false, error: "Commission rate cannot be negative" }
  }
  if (numericRate > 1) {
    return { isValid: false, error: "Commission rate cannot exceed 1 (100%)" }
  }
  const rateString = numericRate.toString()
  const decimalPlaces = (rateString.split(".")[1] || "").length
  if (decimalPlaces > 6) {
    return { isValid: false, error: "Commission rate cannot have more than 6 decimal places" }
  }
  return { isValid: true, numericValue: numericRate }
}

// Job Board functions
export async function getJobs(): Promise<Job[]> {
  const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getActiveJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getFeaturedJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getLatestJobs(limit = 5): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function getJobById(id: string): Promise<Job | null> {
  const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single()
  if (error) throw error
  return data
}

export async function createJob(job: Omit<Job, "id" | "created_at" | "updated_at">): Promise<Job> {
  const { data, error } = await supabase.from("jobs").insert(job).select().single()
  if (error) throw error
  return data
}

export async function updateJob(id: string, updates: Partial<Job>): Promise<Job> {
  const { data, error } = await supabase.from("jobs").update(updates).eq("id", id).select().single()
  if (error) throw error
  return data
}

export async function deleteJob(id: string): Promise<void> {
  const { error } = await supabase.from("jobs").delete().eq("id", id)
  if (error) throw error
}

// Compliance System functions
export async function getComplianceForms(): Promise<ComplianceForm[]> {
  const { data, error } = await supabase.from("compliance_forms").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getActiveComplianceForms(): Promise<ComplianceForm[]> {
  const { data, error } = await supabase
    .from("compliance_forms")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getComplianceFormById(id: string): Promise<ComplianceForm | null> {
  const { data, error } = await supabase.from("compliance_forms").select("*").eq("id", id).single()
  if (error) throw error
  return data
}

export async function createComplianceForm(
  form: Omit<ComplianceForm, "id" | "created_at" | "updated_at">,
): Promise<ComplianceForm> {
  const { data, error } = await supabase.from("compliance_forms").insert(form).select().single()
  if (error) throw error
  return data
}

export async function updateComplianceForm(id: string, updates: Partial<ComplianceForm>): Promise<ComplianceForm> {
  const { data, error } = await supabase.from("compliance_forms").update(updates).eq("id", id).select().single()
  if (error) throw error
  return data
}

export async function deleteComplianceForm(id: string): Promise<void> {
  const { error } = await supabase.from("compliance_forms").delete().eq("id", id)
  if (error) throw error
}

export async function getFormSubmissions(): Promise<FormSubmission[]> {
  const { data, error } = await supabase
    .from("form_submissions")
    .select("*")
    .order("submitted_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getFormSubmissionById(id: string): Promise<FormSubmission | null> {
  const { data, error } = await supabase.from("form_submissions").select("*").eq("id", id).single()
  if (error) throw error
  return data
}

export async function createFormSubmission(
  submission: Omit<FormSubmission, "id" | "submitted_at" | "updated_at">,
): Promise<FormSubmission> {
  const { data, error } = await supabase.from("form_submissions").insert(submission).select().single()
  if (error) throw error
  return data
}

export async function updateFormSubmission(id: string, updates: Partial<FormSubmission>): Promise<FormSubmission> {
  const { data, error } = await supabase.from("form_submissions").update(updates).eq("id", id).select().single()
  if (error) throw error
  return data
}

export async function deleteFormSubmission(id: string): Promise<void> {
  const { error } = await supabase.from("form_submissions").delete().eq("id", id)
  if (error) throw error
}

export async function getFormImages(): Promise<FormImage[]> {
  const { data, error } = await supabase.from("form_images").select("*").order("uploaded_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getFormImagesBySubmissionId(submissionId: string): Promise<FormImage[]> {
  const { data, error } = await supabase.from("form_images").select("*").eq("submission_id", submissionId)
  if (error) throw error
  return data || []
}

export async function createFormImage(image: Omit<FormImage, "id" | "uploaded_at">): Promise<FormImage> {
  const { data, error } = await supabase.from("form_images").insert(image).select().single()
  if (error) throw error
  return data
}

export async function updateFormImage(id: string, updates: Partial<FormImage>): Promise<FormImage> {
  const { data, error } = await supabase.from("form_images").update(updates).eq("id", id).select().single()
  if (error) throw error
  return data
}

export async function deleteFormImage(id: string): Promise<void> {
  const { error } = await supabase.from("form_images").delete().eq("id", id)
  if (error) throw error
}

export async function getFormStatusChanges(): Promise<FormStatus[]> {
  const { data, error } = await supabase
    .from("form_status_changes")
    .select("*")
    .order("changed_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getFormStatusChangesBySubmissionId(submissionId: string): Promise<FormStatus[]> {
  const { data, error } = await supabase.from("form_status_changes").select("*").eq("submission_id", submissionId)
  if (error) throw error
  return data || []
}

export async function createFormStatusChange(statusChange: Omit<FormStatus, "id" | "changed_at">): Promise<FormStatus> {
  const { data, error } = await supabase.from("form_status_changes").insert(statusChange).select().single()
  if (error) throw error
  return data
}

export async function updateFormStatusChange(id: string, updates: Partial<FormStatus>): Promise<FormStatus> {
  const { data, error } = await supabase.from("form_status_changes").update(updates).eq("id", id).select().single()
  if (error) throw error
  return data
}

export async function deleteFormStatusChange(id: string): Promise<void> {
  const { error } = await supabase.from("form_status_changes").delete().eq("id", id)
  if (error) throw error
}

export async function getComplianceChats(): Promise<ComplianceChat[]> {
  const { data, error } = await supabase.from("compliance_chats").select("*").order("sent_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getComplianceChatsBySubmissionId(submissionId: string): Promise<ComplianceChat[]> {
  const { data, error } = await supabase.from("compliance_chats").select("*").eq("submission_id", submissionId)
  if (error) throw error
  return data || []
}

export async function createComplianceChat(chat: Omit<ComplianceChat, "id" | "sent_at">): Promise<ComplianceChat> {
  const { data, error } = await supabase.from("compliance_chats").insert(chat).select().single()
  if (error) throw error
  return data
}

export async function updateComplianceChat(id: string, updates: Partial<ComplianceChat>): Promise<ComplianceChat> {
  const { data, error } = await supabase.from("compliance_chats").update(updates).eq("id", id).select().single()
  if (error) throw error
  return data
}

export async function deleteComplianceChat(id: string): Promise<void> {
  const { error } = await supabase.from("compliance_chats").delete().eq("id", id)
  if (error) throw error
}

// Export all utility functions
export {
  generatePaymentReference,
  calculateDataBundleCommission,
  calculatePreciseCommission,
  formatCommissionRate,
  validateCommissionRate,
}
