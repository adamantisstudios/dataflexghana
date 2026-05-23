import { getAdminClient } from "@/lib/supabase-base"
import { creditStorefrontCommission } from "@/lib/storefront-server"
import type {
  WritingService,
  PublicWritingService,
  WritingOrder,
  CvFields,
} from "@/lib/writing-types"
import { isWritingCategory, parseCvFields } from "@/lib/writing-types"

export function mapWritingServiceRow(row: Record<string, unknown>): WritingService {
  const category = String(row.category || "General")
  return {
    id: String(row.id),
    service_name: String(row.service_name),
    description: row.description != null ? String(row.description) : null,
    price: Number(row.price),
    agent_commission: Number(row.agent_commission ?? 0),
    turnaround_time: String(row.turnaround_time ?? "2-3 business days"),
    category: isWritingCategory(category) ? category : "General",
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
  }
}

export function toPublicWritingService(svc: WritingService): PublicWritingService {
  return {
    id: svc.id,
    service_name: svc.service_name,
    description: svc.description,
    price: svc.price,
    agent_commission: svc.agent_commission,
    turnaround_time: svc.turnaround_time,
    category: svc.category,
  }
}

export async function listActiveWritingServices(): Promise<WritingService[]> {
  const db = getAdminClient()
  const { data, error } = await db
    .from("writing_services")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("service_name", { ascending: true })

  if (error) throw error
  return (data || []).map((r) => mapWritingServiceRow(r as Record<string, unknown>))
}

export async function getVisibleWritingServicesForAgent(agentId: string): Promise<PublicWritingService[]> {
  const db = getAdminClient()
  const { data: settings, error: settingsError } = await db
    .from("agent_store_settings")
    .select("item_id")
    .eq("agent_id", agentId)
    .eq("item_type", "writing_service")
    .eq("is_visible", true)

  if (settingsError) throw settingsError
  const ids = (settings || []).map((s) => s.item_id).filter(Boolean)
  if (ids.length === 0) return []

  const { data: services, error: svcError } = await db
    .from("writing_services")
    .select("*")
    .in("id", ids)
    .eq("is_active", true)

  if (svcError) throw svcError
  return (services || []).map((r) => toPublicWritingService(mapWritingServiceRow(r as Record<string, unknown>)))
}

/** Credit agent commission when order is marked delivered (agent action). */
export async function creditWritingOrderCommissionIfNeeded(
  orderId: string,
  previousStatus: string,
  newStatus: string,
): Promise<{ credited: number }> {
  if (newStatus !== "delivered" || previousStatus === "delivered") {
    return { credited: 0 }
  }

  const db = getAdminClient()
  const { data: order, error } = await db
    .from("writing_orders")
    .select("id, agent_id, agent_commission_earned, commission_credited")
    .eq("id", orderId)
    .maybeSingle()

  if (error || !order?.agent_id || order.commission_credited) {
    return { credited: 0 }
  }

  const commission = Number(order.agent_commission_earned ?? 0)
  if (commission <= 0) return { credited: 0 }

  await creditStorefrontCommission(String(order.agent_id), commission)
  await db.from("writing_orders").update({ commission_credited: true }).eq("id", orderId)

  return { credited: commission }
}

export function mapWritingOrderRow(row: Record<string, unknown>) {
  const svc = row.writing_services as Record<string, unknown> | null | undefined
  const agents = row.agents as Record<string, unknown> | null | undefined
  return {
    id: String(row.id),
    service_id: row.service_id != null ? String(row.service_id) : null,
    agent_id: row.agent_id != null ? String(row.agent_id) : null,
    customer_name: String(row.customer_name),
    customer_phone: String(row.customer_phone),
    customer_email: row.customer_email != null ? String(row.customer_email) : null,
    instructions: row.instructions != null ? String(row.instructions) : null,
    cv_fields: parseCvFields(row.cv_fields),
    attached_file_url: row.attached_file_url != null ? String(row.attached_file_url) : null,
    total_paid: Number(row.total_paid),
    paystack_reference: row.paystack_reference != null ? String(row.paystack_reference) : null,
    status: String(row.status) as WritingOrder["status"],
    completed_file_url: row.completed_file_url != null ? String(row.completed_file_url) : null,
    admin_notes: row.admin_notes != null ? String(row.admin_notes) : null,
    agent_commission_earned: Number(row.agent_commission_earned ?? 0),
    commission_credited: Boolean(row.commission_credited),
    created_at: String(row.created_at),
    writing_services: svc ? mapWritingServiceRow(svc) : null,
    agents: agents
      ? {
          full_name: agents.full_name != null ? String(agents.full_name) : undefined,
          phone_number: agents.phone_number != null ? String(agents.phone_number) : undefined,
        }
      : null,
  }
}

export async function getAgentStoreWhatsapp(agentId: string): Promise<string | null> {
  const db = getAdminClient()
  const { data: profile } = await db
    .from("agent_store_profiles")
    .select("whatsapp_number, phone_number")
    .eq("agent_id", agentId)
    .maybeSingle()

  if (profile?.whatsapp_number) return String(profile.whatsapp_number)
  if (profile?.phone_number) return String(profile.phone_number)

  const { data: agent } = await db.from("agents").select("phone_number, momo_number").eq("id", agentId).maybeSingle()
  return agent?.momo_number ? String(agent.momo_number) : agent?.phone_number ? String(agent.phone_number) : null
}

export function buildCvFieldsPayload(fields: CvFields): CvFields {
  const out: CvFields = {}
  const keys: (keyof CvFields)[] = [
    "target_roles_industries",
    "extra_cv_info",
    "linkedin_url",
    "cv_pages",
    "languages_spoken",
    "current_location",
    "willingness_to_relocate",
    "valid_drivers_license",
  ]
  for (const k of keys) {
    const v = fields[k]?.trim()
    if (v) out[k] = v
  }
  return out
}
