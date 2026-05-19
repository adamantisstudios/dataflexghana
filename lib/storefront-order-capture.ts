import { getAdminClient } from "@/lib/supabase-base"
import { creditStorefrontCommission } from "@/lib/storefront-server"
import { logAudit } from "@/lib/audit-logger"
import {
  metadataValue,
  parseStorefrontItemsFromMetadata,
  type StorefrontCartItemMeta,
} from "@/lib/storefront-order-whatsapp"

export type StorefrontCaptureResult = {
  ok: boolean
  alreadyRecorded: boolean
  orderIds: string[]
  insertedCount: number
  error?: string
}

export async function captureStorefrontPaidOrder(params: {
  reference: string
  agentId: string
  items: StorefrontCartItemMeta[]
  metadata?: Record<string, unknown>
  actorType?: string
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<StorefrontCaptureResult> {
  const reference = params.reference.trim()
  const agentId = params.agentId.trim()

  if (!reference || !agentId || params.items.length === 0) {
    return {
      ok: false,
      alreadyRecorded: false,
      orderIds: [],
      insertedCount: 0,
      error: "Missing reference, agent, or cart items",
    }
  }

  const db = getAdminClient()

  const { data: existing, error: existingError } = await db
    .from("storefront_orders")
    .select("id")
    .eq("paystack_reference", reference)

  if (existingError) {
    console.error("[storefront-capture] existing check:", existingError)
    return {
      ok: false,
      alreadyRecorded: false,
      orderIds: [],
      insertedCount: 0,
      error: existingError.message,
    }
  }

  if (existing?.length) {
    return {
      ok: true,
      alreadyRecorded: true,
      orderIds: existing.map((r) => r.id),
      insertedCount: 0,
    }
  }

  const rows = params.items.map((item) => ({
    agent_id: agentId,
    data_bundle_id: item.data_bundle_id,
    customer_phone: item.customer_phone,
    paystack_reference: reference,
    base_cost: item.base_cost,
    agent_markup: item.agent_markup,
    total_paid: item.total_paid,
    status: "Pending",
  }))

  const { data: inserted, error: insertError } = await db
    .from("storefront_orders")
    .insert(rows)
    .select("id")

  if (insertError) {
    console.error("[storefront-capture] insert failed:", insertError, { reference, agentId, rows })
    return {
      ok: false,
      alreadyRecorded: false,
      orderIds: [],
      insertedCount: 0,
      error: insertError.message,
    }
  }

  const orderIds = (inserted || []).map((r) => r.id as string)
  const totalMarkup = params.items.reduce((sum, item) => sum + Number(item.agent_markup || 0), 0)

  if (totalMarkup > 0) {
    try {
      await creditStorefrontCommission(agentId, totalMarkup)
    } catch (commissionError) {
      console.error("[storefront-capture] commission credit failed:", commissionError)
    }
  }

  await logAudit({
    actorType: params.actorType ?? "system",
    action: "storefront_order_paid",
    targetTable: "storefront_orders",
    targetId: orderIds[0] ?? reference,
    newData: {
      paystack_reference: reference,
      agent_id: agentId,
      order_ids: orderIds,
      item_count: params.items.length,
      total_markup: totalMarkup,
      metadata: params.metadata ?? null,
    },
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  })

  return {
    ok: true,
    alreadyRecorded: false,
    orderIds,
    insertedCount: orderIds.length,
  }
}

export async function captureStorefrontFromPaystackMetadata(params: {
  reference: string
  metadata: Record<string, unknown>
  actorType?: string
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<StorefrontCaptureResult> {
  const agentId = String(metadataValue(params.metadata, "agent_id") || params.metadata.agent_id || "")
  const items = parseStorefrontItemsFromMetadata(params.metadata)

  if (!agentId || items.length === 0) {
    return {
      ok: false,
      alreadyRecorded: false,
      orderIds: [],
      insertedCount: 0,
      error: "Paystack metadata missing agent_id or cart items",
    }
  }

  return captureStorefrontPaidOrder({
    reference: params.reference,
    agentId,
    items,
    metadata: params.metadata,
    actorType: params.actorType,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

export async function countPendingStorefrontOrders(): Promise<number> {
  const db = getAdminClient()
  const { count, error } = await db
    .from("storefront_orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "Pending")

  if (error) {
    console.error("[storefront-capture] pending count:", error)
    return 0
  }
  return count ?? 0
}
