import { getAdminClient } from "@/lib/supabase-base"
import { logAudit } from "@/lib/audit-logger"
import { calculateInfluencerFees } from "@/lib/influencer-types"

export type InfluencerCaptureResult = {
  ok: boolean
  alreadyRecorded: boolean
  orderId?: string
  error?: string
}

export async function captureInfluencerOrderFromPaystack(params: {
  reference: string
  agentId: string
  packageId: string
  clientName: string
  clientPhone: string
  clientEmail?: string | null
  requirements: string
  packagePrice: number
  actorType?: string
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<InfluencerCaptureResult> {
  const reference = params.reference.trim()
  if (!reference || !params.agentId || !params.packageId) {
    return { ok: false, alreadyRecorded: false, error: "Missing payment data" }
  }

  const db = getAdminClient()
  const { data: existing } = await db
    .from("influencer_orders")
    .select("id")
    .eq("paystack_reference", reference)
    .maybeSingle()

  if (existing?.id) {
    return { ok: true, alreadyRecorded: true, orderId: existing.id }
  }

  const fees = calculateInfluencerFees(params.packagePrice)

  const { data: inserted, error } = await db
    .from("influencer_orders")
    .insert({
      package_id: params.packageId,
      agent_id: params.agentId,
      client_name: params.clientName,
      client_phone: params.clientPhone,
      client_email: params.clientEmail || null,
      requirements: params.requirements.trim(),
      total_price: fees.total_price,
      platform_fee_client: fees.platform_fee_client,
      platform_fee_influencer: fees.platform_fee_influencer,
      influencer_payout: fees.influencer_payout,
      paystack_reference: reference,
      status: "pending",
      escrow_released: false,
    })
    .select("id")
    .single()

  if (error) {
    return { ok: false, alreadyRecorded: false, error: error.message }
  }

  await logAudit({
    actorType: params.actorType ?? "storefront_customer",
    action: "influencer_order_paid",
    targetTable: "influencer_orders",
    targetId: inserted.id,
    newData: {
      paystack_reference: reference,
      agent_id: params.agentId,
      package_id: params.packageId,
      total_price: fees.total_price,
    },
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  })
  await logAudit({
    actorType: params.actorType ?? "storefront_customer",
    action: "new_order",
    severity: "warning",
    targetTable: "influencer_orders",
    targetId: inserted.id,
    newData: {
      paystack_reference: reference,
      agent_id: params.agentId,
      package_id: params.packageId,
      total_price: fees.total_price,
      order_type: "influencer",
    },
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  })

  return { ok: true, alreadyRecorded: false, orderId: inserted.id }
}
