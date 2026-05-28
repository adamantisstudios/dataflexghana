import { getAdminClient } from "@/lib/supabase-base"
import { creditStorefrontCommission } from "@/lib/storefront-server"
import { logAudit } from "@/lib/audit-logger"
import {
  metadataValue,
  parseStorefrontItemsFromMetadata,
  type StorefrontCartItemMeta,
} from "@/lib/storefront-order-whatsapp"
import {
  parseWholesaleItemsFromMetadata,
  parseBuyerDetailsFromMetadata,
} from "@/lib/storefront-paystack-meta"
import { COMPLIANCE_FORM_SOLE_PROPRIETORSHIP } from "@/lib/storefront-catalog"
import { captureAdOrderFromPaystack } from "@/lib/advertising-capture"
import { captureFarmOrdersFromPaystack, type FarmCartLineMeta } from "@/lib/farm-capture"
import { captureWritingOrderFromPaystack } from "@/lib/writing-capture"
import { parseCvFields } from "@/lib/writing-types"
import { captureInfluencerOrderFromPaystack } from "@/lib/influencer-capture"

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
    console.error("[storefront-capture] insert failed:", insertError.message, insertError.details, {
      reference,
      agentId,
      rowCount: rows.length,
    })
    await logAudit({
      actorType: params.actorType ?? "system",
      action: "storefront_order_capture_failed",
      targetTable: "storefront_orders",
      targetId: reference,
      newData: {
        paystack_reference: reference,
        agent_id: agentId,
        error: insertError.message,
        details: insertError.details ?? null,
        row_count: rows.length,
      },
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    })
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
  await logAudit({
    actorType: params.actorType ?? "system",
    action: "new_order",
    severity: "warning",
    targetTable: "storefront_orders",
    targetId: orderIds[0] ?? reference,
    newData: {
      paystack_reference: reference,
      agent_id: agentId,
      order_ids: orderIds,
      order_type: "data_bundle",
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

export async function captureWholesalePaidOrder(params: {
  reference: string
  agentId: string
  metadata: Record<string, unknown>
  actorType?: string
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<StorefrontCaptureResult> {
  const reference = params.reference.trim()
  const agentId = params.agentId.trim()
  const wholesaleItems = parseWholesaleItemsFromMetadata(params.metadata)
  const buyerDetails = parseBuyerDetailsFromMetadata(params.metadata)

  if (!reference || !agentId || wholesaleItems.length === 0) {
    return {
      ok: false,
      alreadyRecorded: false,
      orderIds: [],
      insertedCount: 0,
      error: "Missing wholesale cart data",
    }
  }

  const db = getAdminClient()
  const { data: existing } = await db
    .from("storefront_orders")
    .select("id")
    .eq("paystack_reference", reference)

  if (existing?.length) {
    return {
      ok: true,
      alreadyRecorded: true,
      orderIds: existing.map((r) => r.id),
      insertedCount: 0,
    }
  }

  const rows = wholesaleItems.map((item) => ({
    agent_id: agentId,
    order_type: "wholesale_product",
    wholesale_product_id: item.wholesale_product_id,
    data_bundle_id: null,
    customer_phone: buyerDetails?.contact_number ?? null,
    paystack_reference: reference,
    base_cost: item.base_cost * item.quantity,
    agent_markup: item.agent_markup * item.quantity,
    total_paid: item.total_paid,
    quantity: item.quantity,
    item_title: item.product_name,
    buyer_details: buyerDetails,
    status: "Pending",
  }))

  const { data: inserted, error: insertError } = await db
    .from("storefront_orders")
    .insert(rows)
    .select("id")

  if (insertError) {
    return {
      ok: false,
      alreadyRecorded: false,
      orderIds: [],
      insertedCount: 0,
      error: insertError.message,
    }
  }

  const orderIds = (inserted || []).map((r) => r.id as string)
  const totalMarkup = wholesaleItems.reduce((sum, item) => sum + Number(item.agent_markup) * item.quantity, 0)

  if (totalMarkup > 0) {
    try {
      await creditStorefrontCommission(agentId, totalMarkup)
    } catch (e) {
      console.error("[storefront-capture] wholesale commission:", e)
    }
  }

  await logAudit({
    actorType: params.actorType ?? "system",
    action: "new_order",
    severity: "warning",
    targetTable: "storefront_orders",
    targetId: orderIds[0] ?? reference,
    newData: {
      paystack_reference: reference,
      agent_id: agentId,
      order_ids: orderIds,
      order_type: "wholesale",
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

export async function captureCompliancePayment(params: {
  reference: string
  agentId: string
  formType: string
  amountPaid: number
  metadata?: Record<string, unknown>
}): Promise<{ ok: boolean; error?: string }> {
  const db = getAdminClient()
  const { data: existing } = await db
    .from("storefront_compliance_submissions")
    .select("id")
    .eq("paystack_reference", params.reference)
    .maybeSingle()

  if (existing) return { ok: true }

  const { error } = await db.from("storefront_compliance_submissions").insert({
    agent_id: params.agentId,
    form_type: params.formType || COMPLIANCE_FORM_SOLE_PROPRIETORSHIP,
    customer_data: {},
    status: "paid_pending_form",
    paystack_reference: params.reference,
    amount_paid: params.amountPaid,
  })

  if (error) {
    return { ok: false, error: error.message }
  }
  await logAudit({
    actorType: "system",
    action: "new_order",
    severity: "warning",
    targetTable: "storefront_compliance_submissions",
    targetId: params.reference,
    newData: {
      paystack_reference: params.reference,
      agent_id: params.agentId,
      form_type: params.formType,
      amount_paid: params.amountPaid,
      order_type: "compliance",
    },
  })
  return { ok: true }
}

export async function captureStorefrontFromPaystackMetadata(params: {
  reference: string
  metadata: Record<string, unknown>
  actorType?: string
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<StorefrontCaptureResult> {
  const agentId = String(metadataValue(params.metadata, "agent_id") || params.metadata.agent_id || "")
  const orderType = String(
    metadataValue(params.metadata, "order_type") || params.metadata.order_type || "data_bundle",
  )

  if (!agentId) {
    return {
      ok: false,
      alreadyRecorded: false,
      orderIds: [],
      insertedCount: 0,
      error: "Paystack metadata missing agent_id",
    }
  }

  if (orderType === "wholesale") {
    return captureWholesalePaidOrder({
      reference: params.reference,
      agentId,
      metadata: params.metadata,
      actorType: params.actorType,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    })
  }

  if (orderType === "farm_produce") {
    let items: FarmCartLineMeta[] = []
    try {
      const raw = metadataValue(params.metadata, "farm_items_json") || params.metadata.farm_items_json
      items = typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? raw : []
    } catch {
      items = []
    }

    const result = await captureFarmOrdersFromPaystack({
      reference: params.reference,
      buyerName: String(metadataValue(params.metadata, "buyer_name") || ""),
      buyerPhone: String(metadataValue(params.metadata, "buyer_phone") || ""),
      buyerEmail: String(metadataValue(params.metadata, "buyer_email") || "") || null,
      deliveryAddress: String(metadataValue(params.metadata, "delivery_address") || ""),
      deliveryFee: Number(params.metadata.delivery_fee ?? 0),
      items,
      actorType: params.actorType,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    })

    return {
      ok: result.ok,
      alreadyRecorded: result.alreadyRecorded,
      orderIds: result.orderIds,
      insertedCount: result.ok && !result.alreadyRecorded ? result.orderIds.length : 0,
      error: result.error,
    }
  }

  if (orderType === "influencer_order") {
    const packagePrice = Number(
      metadataValue(params.metadata, "package_price") ?? params.metadata.package_price ?? 0,
    )
    const result = await captureInfluencerOrderFromPaystack({
      reference: params.reference,
      agentId,
      packageId: String(metadataValue(params.metadata, "package_id") || params.metadata.package_id || ""),
      clientName: String(metadataValue(params.metadata, "client_name") || ""),
      clientPhone: String(metadataValue(params.metadata, "client_phone") || ""),
      clientEmail: String(metadataValue(params.metadata, "client_email") || "") || null,
      requirements: String(metadataValue(params.metadata, "requirements") || ""),
      packagePrice,
      actorType: params.actorType,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    })
    return {
      ok: result.ok,
      alreadyRecorded: result.alreadyRecorded,
      orderIds: result.orderId ? [result.orderId] : [],
      insertedCount: result.ok && !result.alreadyRecorded ? 1 : 0,
      error: result.error,
    }
  }

  if (orderType === "writing_service") {
    let cvFields = {}
    try {
      const raw = metadataValue(params.metadata, "cv_fields_json") || params.metadata.cv_fields_json
      cvFields = typeof raw === "string" ? parseCvFields(JSON.parse(raw)) : parseCvFields(raw)
    } catch {
      cvFields = {}
    }

    const result = await captureWritingOrderFromPaystack({
      reference: params.reference,
      agentId,
      serviceId: String(metadataValue(params.metadata, "service_id") || params.metadata.service_id || ""),
      customerName: String(metadataValue(params.metadata, "customer_name") || ""),
      customerPhone: String(metadataValue(params.metadata, "customer_phone") || ""),
      customerEmail: String(metadataValue(params.metadata, "customer_email") || "") || null,
      instructions: String(metadataValue(params.metadata, "instructions") || "") || null,
      cvFields,
      attachedFileUrl: String(metadataValue(params.metadata, "attached_file_url") || "") || null,
      totalPaid: Number(params.metadata.cart_total ?? params.metadata.amount ?? 0),
      agentCommission: Number(params.metadata.agent_commission ?? 0),
      actorType: params.actorType,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    })
    return {
      ok: result.ok,
      alreadyRecorded: result.alreadyRecorded,
      orderIds: result.orderId ? [result.orderId] : [],
      insertedCount: result.ok && !result.alreadyRecorded ? 1 : 0,
      error: result.error,
    }
  }

  if (orderType === "ad_package" || orderType === "advertising") {
    const result = await captureAdOrderFromPaystack({
      reference: params.reference,
      agentId,
      packageId: String(metadataValue(params.metadata, "package_id") || params.metadata.package_id || ""),
      customerName: String(metadataValue(params.metadata, "customer_name") || ""),
      customerPhone: String(metadataValue(params.metadata, "customer_phone") || ""),
      customerEmail: String(metadataValue(params.metadata, "customer_email") || "") || null,
      customerBusiness: String(metadataValue(params.metadata, "customer_business") || "") || null,
      adMessage: String(metadataValue(params.metadata, "ad_message") || "") || null,
      totalPaid: Number(params.metadata.cart_total ?? params.metadata.amount ?? 0),
      actorType: params.actorType,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    })
    return {
      ok: result.ok,
      alreadyRecorded: result.alreadyRecorded,
      orderIds: result.orderId ? [result.orderId] : [],
      insertedCount: result.ok && !result.alreadyRecorded ? 1 : 0,
      error: result.error,
    }
  }

  if (orderType === "compliance") {
    const amount = Number(params.metadata.cart_total ?? params.metadata.amount ?? 0)
    const formType = String(
      metadataValue(params.metadata, "form_type") || COMPLIANCE_FORM_SOLE_PROPRIETORSHIP,
    )
    const result = await captureCompliancePayment({
      reference: params.reference,
      agentId,
      formType,
      amountPaid: amount,
      metadata: params.metadata,
    })
    return {
      ok: result.ok,
      alreadyRecorded: false,
      orderIds: [],
      insertedCount: result.ok ? 1 : 0,
      error: result.error,
    }
  }

  const items = parseStorefrontItemsFromMetadata(params.metadata)
  if (items.length === 0) {
    return {
      ok: false,
      alreadyRecorded: false,
      orderIds: [],
      insertedCount: 0,
      error: "Paystack metadata missing cart items",
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
