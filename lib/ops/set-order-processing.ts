import { getAdminClient } from "@/lib/supabase-base"
import { logAudit } from "@/lib/audit-logger"
import { notifyAdminOps } from "@/lib/ops/notify-admin-ops"

export type ProcessingEntityType =
  | "data_orders"
  | "wholesale_orders"
  | "bulk_orders"
  | "mtnafa_registrations"

export type SetProcessingResult =
  | { ok: true; entityType: ProcessingEntityType; entityId: string; previousStatus: string }
  | { ok: false; error: string; skipped?: boolean }

const PENDING_STATUSES = new Set(["pending", "pending_admin_review"])

/**
 * Safely move a pending order-like row to processing.
 * Does NOT credit wallets, complete orders, or change commission logic.
 */
export async function setEntityProcessing(params: {
  entityType: ProcessingEntityType
  entityId: string
  reason?: string
  momoTransactionId?: string | null
  referenceCode?: string | null
  amount?: number | null
}): Promise<SetProcessingResult> {
  const db = getAdminClient()
  const table = params.entityType

  const { data: row, error: fetchError } = await db
    .from(table)
    .select("id, status")
    .eq("id", params.entityId)
    .maybeSingle()

  if (fetchError) {
    return { ok: false, error: fetchError.message }
  }
  if (!row) {
    return { ok: false, error: `${table} row not found` }
  }

  const previousStatus = String(row.status ?? "")
  if (previousStatus === "processing") {
    return { ok: true, entityType: table, entityId: row.id, previousStatus }
  }

  if (!PENDING_STATUSES.has(previousStatus)) {
    return {
      ok: false,
      skipped: true,
      error: `Cannot move ${table} from status "${previousStatus}" to processing`,
    }
  }

  const { error: updateError } = await db
    .from(table)
    .update({
      status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.entityId)
    .eq("status", previousStatus)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  await logAudit({
    actorType: "ops_device",
    action: "momo_sms_set_processing",
    severity: "info",
    targetTable: table,
    targetId: params.entityId,
    oldData: { status: previousStatus },
    newData: {
      status: "processing",
      reason: params.reason ?? "momo_sms_match",
      momo_transaction_id: params.momoTransactionId ?? null,
      reference_code: params.referenceCode ?? null,
      amount: params.amount ?? null,
    },
    skipEnrichment: true,
  })

  await notifyAdminOps({
    category: table === "data_orders" ? "orders" : table,
    severity: "warning",
    title: `Payment matched — moved to processing`,
    body: `${table} ${params.entityId.slice(0, 8)}… ref ${params.referenceCode ?? "?"} GHS ${params.amount ?? "?"} → processing. Fulfill now.`,
    deeplinkTab: table === "data_orders" ? "orders" : table === "wholesale_orders" ? "wholesale" : "bulk-orders",
    entityType: table,
    entityId: params.entityId,
    requiresAck: true,
    source: "momo_sms",
    payload: {
      previous_status: previousStatus,
      momo_transaction_id: params.momoTransactionId,
      reference_code: params.referenceCode,
      amount: params.amount,
    },
  })

  return { ok: true, entityType: table, entityId: params.entityId, previousStatus }
}
