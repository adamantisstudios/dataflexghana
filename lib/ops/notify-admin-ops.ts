import { getAdminClient } from "@/lib/supabase-base"

export type OpsInboxSeverity = "info" | "warning" | "critical"

export type OpsInboxSource =
  | "audit_log"
  | "pending"
  | "momo_sms"
  | "registration"
  | "system"
  | "guest_order"
  | "admin_notification"

export type NotifyAdminOpsParams = {
  category: string
  severity?: OpsInboxSeverity
  title: string
  body?: string | null
  deeplinkTab?: string | null
  entityType?: string | null
  entityId?: string | null
  requiresAck?: boolean
  source?: OpsInboxSource
  payload?: Record<string, unknown> | null
}

export type AdminOpsInboxRow = {
  id: string
  category: string
  severity: string
  title: string
  body: string | null
  deeplink_tab: string | null
  entity_type: string | null
  entity_id: string | null
  requires_ack: boolean
  acked_at: string | null
  acked_by_device: string | null
  source: string
  payload: Record<string, unknown> | null
  created_at: string
}

/**
 * Best-effort write to admin_ops_inbox. Never throws — callers must not break primary flows.
 */
export async function notifyAdminOps(params: NotifyAdminOpsParams): Promise<string | null> {
  try {
    const db = getAdminClient()
    const { data, error } = await db
      .from("admin_ops_inbox")
      .insert({
        category: params.category,
        severity: params.severity ?? "info",
        title: params.title,
        body: params.body ?? null,
        deeplink_tab: params.deeplinkTab ?? null,
        entity_type: params.entityType ?? null,
        entity_id: params.entityId ?? null,
        requires_ack: params.requiresAck ?? false,
        source: params.source ?? "system",
        payload: params.payload ?? null,
      })
      .select("id")
      .single()

    if (error) {
      console.error("[notify-admin-ops] insert failed:", error.message)
      return null
    }
    return data?.id ?? null
  } catch (err) {
    console.error("[notify-admin-ops] unexpected:", err)
    return null
  }
}

/**
 * Map known audit actions (SecurityNotificationBell + pending admin work)
 * to ops inbox categories / ack requirements.
 */
export function mapAuditActionToOps(action: string): {
  category: string
  deeplinkTab: string | null
  requiresAck: boolean
  severity: OpsInboxSeverity
} | null {
  switch (action) {
    case "new_order":
    case "storefront_order_paid":
    case "ad_order_paid":
    case "guest_data_order":
    case "no_registration_order":
      return { category: "orders", deeplinkTab: "orders", requiresAck: true, severity: "warning" }

    case "manual_wallet_topup":
      // Handled explicitly in admin-wallet-topup-notify (sticky). Skip audit duplicate.
      return null

    case "agent_registered":
    case "agent_registration":
      return { category: "agents", deeplinkTab: "agents", requiresAck: true, severity: "warning" }

    case "profile_photo_auto_verified":
      // Handled explicitly in admin-photo-verification-notify
      return null

    case "withdrawal_request":
    case "withdrawal_requested":
    case "large_withdrawal_requested":
      return {
        category: "withdrawals",
        deeplinkTab: "withdrawals",
        requiresAck: true,
        severity: action === "large_withdrawal_requested" ? "critical" : "warning",
      }

    case "official_announcement":
    case "official_announcement_published":
      return { category: "announcements", deeplinkTab: null, requiresAck: false, severity: "info" }

    case "payment_received":
    case "paystack_payment_received":
      return { category: "payments", deeplinkTab: "orders", requiresAck: true, severity: "warning" }

    case "failed_login":
    case "rate_limit_hit":
    case "withdrawal_blocked_cooldown":
    case "storefront_webhook_capture_failed":
    case "wallet_topup_webhook_capture_failed":
    case "storefront_order_capture_failed":
      return { category: "security", deeplinkTab: "security-log", requiresAck: true, severity: "critical" }

    case "payout_marked_paid":
    case "agent_login":
      return { category: "security", deeplinkTab: "security-log", requiresAck: false, severity: "info" }

    default:
      return null
  }
}

/** Mirror a legacy admin_notifications row into the phone ops inbox. */
export async function notifyAdminOpsFromAdminNotification(params: {
  type: string
  preview: string
  agentId?: string | null
  submissionId?: string | null
}): Promise<string | null> {
  const type = params.type.toLowerCase()
  let category = "pending"
  let deeplinkTab: string | null = "orders"
  if (type.includes("wallet")) {
    category = "wallets"
    deeplinkTab = "wallets"
  } else if (type.includes("afa") || type.includes("mtn")) {
    category = "orders"
    deeplinkTab = "mtn-afa"
  } else if (type.includes("bulk")) {
    category = "orders"
    deeplinkTab = "bulk-orders"
  } else if (type.includes("photo")) {
    category = "agents"
    deeplinkTab = "agents"
  }

  return notifyAdminOps({
    category,
    severity: "warning",
    title: params.preview.slice(0, 120) || `Admin notice: ${params.type}`,
    body: params.preview,
    deeplinkTab,
    entityType: params.type,
    entityId: params.submissionId ?? params.agentId ?? null,
    requiresAck: true,
    source: "admin_notification",
    payload: {
      type: params.type,
      agent_id: params.agentId ?? null,
      submission_id: params.submissionId ?? null,
    },
  })
}

export async function listOpsInbox(params: {
  since?: string | null
  unackedOnly?: boolean
  limit?: number
}): Promise<AdminOpsInboxRow[]> {
  const db = getAdminClient()
  let query = db.from("admin_ops_inbox").select("*").order("created_at", { ascending: false })

  if (params.since) {
    query = query.gt("created_at", params.since)
  }
  if (params.unackedOnly) {
    query = query.eq("requires_ack", true).is("acked_at", null)
  }

  const limit = Math.min(Math.max(params.limit ?? 100, 1), 500)
  query = query.limit(limit)

  const { data, error } = await query
  if (error) {
    console.error("[ops-inbox] list failed:", error.message)
    return []
  }
  return (data ?? []) as AdminOpsInboxRow[]
}

export async function ackOpsInboxItem(
  id: string,
  deviceId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const db = getAdminClient()
  const { data: existing, error: fetchError } = await db
    .from("admin_ops_inbox")
    .select("id, acked_at")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    return { ok: false, error: fetchError.message }
  }
  if (!existing) {
    return { ok: false, error: "Inbox item not found" }
  }
  if (existing.acked_at) {
    return { ok: true }
  }

  const { error } = await db
    .from("admin_ops_inbox")
    .update({
      acked_at: new Date().toISOString(),
      acked_by_device: deviceId && deviceId !== "00000000-0000-0000-0000-000000000001" ? deviceId : null,
    })
    .eq("id", id)

  if (error) {
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
