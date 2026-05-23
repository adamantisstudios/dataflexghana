import { getAdminClient } from "@/lib/supabase-base"
import { logAudit } from "@/lib/audit-logger"
import { computeAgentCommission, getFarmCommissionRate } from "@/lib/farm-server"

export type FarmCartLineMeta = {
  listing_id: string
  quantity: number
  unit_price: number
  line_total: number
  produce_name: string
  agent_id: string
  admin_markup_per_unit: number
}

export type FarmCaptureResult = {
  ok: boolean
  alreadyRecorded: boolean
  orderIds: string[]
  error?: string
}

export async function captureFarmOrdersFromPaystack(params: {
  reference: string
  buyerName: string
  buyerPhone: string
  buyerEmail?: string | null
  deliveryAddress: string
  deliveryFee: number
  items: FarmCartLineMeta[]
  actorType?: string
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<FarmCaptureResult> {
  const reference = params.reference.trim()
  if (!reference || params.items.length === 0) {
    return { ok: false, alreadyRecorded: false, orderIds: [], error: "Missing payment data" }
  }

  const db = getAdminClient()
  const { data: existing } = await db
    .from("farm_orders")
    .select("id")
    .eq("paystack_reference", reference)
    .limit(1)

  if (existing?.length) {
    const { data: all } = await db.from("farm_orders").select("id").eq("paystack_reference", reference)
    return {
      ok: true,
      alreadyRecorded: true,
      orderIds: (all || []).map((r) => String(r.id)),
    }
  }

  const rate = await getFarmCommissionRate()
  const feePerLine =
    params.items.length > 0 ? Number((params.deliveryFee / params.items.length).toFixed(2)) : 0

  const rows = params.items.map((item) => ({
    listing_id: item.listing_id,
    agent_id: item.agent_id,
    buyer_name: params.buyerName,
    buyer_phone: params.buyerPhone,
    buyer_email: params.buyerEmail || null,
    delivery_address: params.deliveryAddress,
    quantity_ordered: item.quantity,
    total_price: item.line_total,
    delivery_fee: feePerLine,
    paystack_reference: reference,
    status: "pending",
    agent_commission: computeAgentCommission(item.admin_markup_per_unit, item.quantity, rate),
    commission_credited: false,
  }))

  const { data: inserted, error } = await db.from("farm_orders").insert(rows).select("id")

  if (error) {
    return { ok: false, alreadyRecorded: false, orderIds: [], error: error.message }
  }

  for (const item of params.items) {
    const { data: listing } = await db
      .from("farm_listings")
      .select("quantity_available")
      .eq("id", item.listing_id)
      .maybeSingle()

    if (listing) {
      const remaining = Math.max(0, Number(listing.quantity_available) - item.quantity)
      await db
        .from("farm_listings")
        .update({
          quantity_available: remaining,
          is_fulfilled: remaining <= 0,
        })
        .eq("id", item.listing_id)
    }
  }

  await logAudit({
    actorType: params.actorType ?? "farm_buyer",
    action: "farm_order_paid",
    targetTable: "farm_orders",
    targetId: inserted?.[0]?.id ?? reference,
    newData: { paystack_reference: reference, line_count: rows.length },
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  })

  return {
    ok: true,
    alreadyRecorded: false,
    orderIds: (inserted || []).map((r) => String(r.id)),
  }
}
