import { getAdminClient } from "@/lib/supabase-base"
import { logAudit } from "@/lib/audit-logger"
import { buildCvFieldsPayload } from "@/lib/writing-server"
import type { CvFields } from "@/lib/writing-types"

export type WritingCaptureResult = {
  ok: boolean
  alreadyRecorded: boolean
  orderId?: string
  error?: string
}

export async function captureWritingOrderFromPaystack(params: {
  reference: string
  agentId: string
  serviceId: string
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  instructions?: string | null
  cvFields?: CvFields
  attachedFileUrl?: string | null
  totalPaid: number
  agentCommission: number
  actorType?: string
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<WritingCaptureResult> {
  const reference = params.reference.trim()
  if (!reference || !params.agentId || !params.serviceId) {
    return { ok: false, alreadyRecorded: false, error: "Missing payment data" }
  }

  const db = getAdminClient()
  const { data: existing } = await db
    .from("writing_orders")
    .select("id")
    .eq("paystack_reference", reference)
    .maybeSingle()

  if (existing?.id) {
    return { ok: true, alreadyRecorded: true, orderId: existing.id }
  }

  const cv_fields = buildCvFieldsPayload(params.cvFields || {})

  const { data: inserted, error } = await db
    .from("writing_orders")
    .insert({
      service_id: params.serviceId,
      agent_id: params.agentId,
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      customer_email: params.customerEmail || null,
      instructions: params.instructions?.trim() || null,
      cv_fields,
      attached_file_url: params.attachedFileUrl || null,
      total_paid: params.totalPaid,
      paystack_reference: reference,
      status: "pending",
      agent_commission_earned: params.agentCommission,
      commission_credited: false,
    })
    .select("id")
    .single()

  if (error) {
    return { ok: false, alreadyRecorded: false, error: error.message }
  }

  await logAudit({
    actorType: params.actorType ?? "storefront_customer",
    action: "writing_order_paid",
    targetTable: "writing_orders",
    targetId: inserted.id,
    newData: {
      paystack_reference: reference,
      agent_id: params.agentId,
      service_id: params.serviceId,
      total_paid: params.totalPaid,
    },
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  })

  return { ok: true, alreadyRecorded: false, orderId: inserted.id }
}
