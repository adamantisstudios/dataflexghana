import { getAdminClient } from "@/lib/supabase-base"
import { logAudit } from "@/lib/audit-logger"

export type AdCaptureResult = {
  ok: boolean
  alreadyRecorded: boolean
  orderId?: string
  error?: string
}

export async function captureAdOrderFromPaystack(params: {
  reference: string
  agentId: string
  packageId: string
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  customerBusiness?: string | null
  adMessage?: string | null
  totalPaid: number
  actorType?: string
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<AdCaptureResult> {
  const reference = params.reference.trim()
  if (!reference || !params.agentId || !params.packageId) {
    return { ok: false, alreadyRecorded: false, error: "Missing payment data" }
  }

  const db = getAdminClient()
  const { data: existing } = await db
    .from("ad_orders")
    .select("id")
    .eq("paystack_reference", reference)
    .maybeSingle()

  if (existing?.id) {
    return { ok: true, alreadyRecorded: true, orderId: existing.id }
  }

  const { data: inserted, error } = await db
    .from("ad_orders")
    .insert({
      package_id: params.packageId,
      agent_id: params.agentId,
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      customer_email: params.customerEmail || null,
      customer_business: params.customerBusiness || null,
      ad_message: params.adMessage || null,
      total_paid: params.totalPaid,
      paystack_reference: reference,
      status: "pending",
    })
    .select("id")
    .single()

  if (error) {
    return { ok: false, alreadyRecorded: false, error: error.message }
  }

  await logAudit({
    actorType: params.actorType ?? "storefront_customer",
    action: "ad_order_paid",
    targetTable: "ad_orders",
    targetId: inserted.id,
    newData: {
      paystack_reference: reference,
      agent_id: params.agentId,
      package_id: params.packageId,
      total_paid: params.totalPaid,
    },
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  })
  await logAudit({
    actorType: params.actorType ?? "storefront_customer",
    action: "new_order",
    severity: "warning",
    targetTable: "ad_orders",
    targetId: inserted.id,
    newData: {
      paystack_reference: reference,
      agent_id: params.agentId,
      package_id: params.packageId,
      total_paid: params.totalPaid,
      order_type: "advertising",
    },
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  })

  return { ok: true, alreadyRecorded: false, orderId: inserted.id }
}
