import { type NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { enrichAuditEvent, maskIpAddress, type SessionEnrichment } from "@/lib/security-enrichment"
import { mapAuditActionToOps, notifyAdminOps } from "@/lib/ops/notify-admin-ops"

export type AuditSeverity = "info" | "warning" | "critical"

export type AuditLogParams = {
  actorId?: string | null
  actorType: string
  action: string
  severity?: AuditSeverity
  targetTable?: string | null
  targetId?: string | null
  oldData?: Record<string, unknown> | null
  newData?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
  /** Skip session enrichment (e.g. high-volume non-security events). */
  skipEnrichment?: boolean
}

const SENSITIVE_ACTIONS = new Set([
  "failed_login",
  "agent_login",
  "rate_limit_hit",
  "agent_registered",
  "withdrawal_request",
  "withdrawal_blocked_cooldown",
  "withdrawal_blocked",
  "payout_marked_paid",
  "payout_completed",
  "payout_cancelled",
  "admin_login",
  "failed_admin_login",
])

export function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null
  }
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return null
}

export function getClientUserAgent(request: NextRequest): string | null {
  return request.headers.get("user-agent")
}

export function getRequestClientMeta(request: NextRequest): {
  ipAddress: string | null
  userAgent: string | null
} {
  return {
    ipAddress: getClientIp(request),
    userAgent: getClientUserAgent(request),
  }
}

function isSensitiveAudit(action: string, severity: AuditSeverity): boolean {
  if (severity === "critical" || severity === "warning") return true
  if (SENSITIVE_ACTIONS.has(action)) return true
  const lower = action.toLowerCase()
  return (
    lower.includes("login") ||
    lower.includes("withdraw") ||
    lower.includes("payout") ||
    lower.includes("rate_limit") ||
    lower.includes("fraud") ||
    lower.includes("blocked")
  )
}

function stripRawIpFields(data: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null
  const { ip_address: _a, ip: _b, client_ip: _c, ...rest } = data
  return Object.keys(rest).length > 0 ? rest : {}
}

async function buildEnrichedNewData(
  params: AuditLogParams,
): Promise<Record<string, unknown> | null> {
  const severity = params.severity ?? "info"
  const base = stripRawIpFields(params.newData) ?? {}
  const shouldEnrich =
    !params.skipEnrichment && isSensitiveAudit(params.action, severity)

  if (!shouldEnrich) {
    return Object.keys(base).length > 0 ? base : params.newData ?? null
  }

  const ip = params.ipAddress?.trim() || ""
  const ua = params.userAgent?.trim() || ""

  let session: SessionEnrichment
  try {
    session = await enrichAuditEvent(ip, ua)
  } catch (err) {
    console.error("[audit-logger] enrichAuditEvent failed:", err)
    session = {
      country: "Unknown",
      city: "Unknown",
      isp: "Unknown",
      proxy: false,
      device: "Unknown",
      browser: "Unknown",
      os: "Unknown",
    }
  }

  return { ...base, session }
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const db = getAdminClient()
    const severity = params.severity ?? "info"
    const new_data = await buildEnrichedNewData(params)
    const maskedIp = maskIpAddress(params.ipAddress)

    const { error } = await db.from("audit_log").insert({
      actor_id: params.actorId ?? null,
      actor_type: params.actorType,
      action: params.action,
      severity,
      target_table: params.targetTable ?? null,
      target_id: params.targetId ?? null,
      old_data: params.oldData ?? null,
      new_data,
      ip_address: maskedIp,
      user_agent: params.userAgent ?? null,
    })
    if (error) {
      console.error("[audit-logger] failed to write audit_log:", error)
    } else {
      // Additive fan-out to admin ops inbox (Android app). Never throws / never blocks primary flow.
      try {
        const mapped = mapAuditActionToOps(params.action)
        if (mapped) {
          const href =
            (new_data && typeof new_data === "object" && "href_tab" in new_data
              ? String((new_data as Record<string, unknown>).href_tab ?? "")
              : "") || mapped.deeplinkTab
          const amount =
            new_data && typeof new_data === "object" && "amount" in new_data
              ? (new_data as Record<string, unknown>).amount
              : null
          const orderType =
            new_data && typeof new_data === "object" && "order_type" in new_data
              ? String((new_data as Record<string, unknown>).order_type ?? "")
              : params.action
          await notifyAdminOps({
            category: mapped.category,
            severity: mapped.severity === "info" && severity !== "info" ? severity : mapped.severity,
            title: titleForAuditAction(params.action, orderType, amount),
            body: bodyForAuditAction(params.action, new_data),
            deeplinkTab: href || mapped.deeplinkTab,
            entityType: params.targetTable ?? null,
            entityId: params.targetId ?? null,
            requiresAck: mapped.requiresAck,
            source: "audit_log",
            payload: {
              action: params.action,
              ...(new_data && typeof new_data === "object" ? new_data : {}),
            },
          })
        } else if (severity === "critical" || severity === "warning") {
          await notifyAdminOps({
            category: "security",
            severity,
            title: `Admin alert: ${params.action}`,
            body: params.targetTable
              ? `${params.targetTable}${params.targetId ? ` #${String(params.targetId).slice(0, 8)}` : ""}`
              : null,
            deeplinkTab: "security-log",
            entityType: params.targetTable ?? null,
            entityId: params.targetId ?? null,
            requiresAck: severity === "critical",
            source: "audit_log",
            payload: { action: params.action, ...(new_data && typeof new_data === "object" ? new_data : {}) },
          })
        }
      } catch (fanoutErr) {
        console.error("[audit-logger] ops inbox fan-out failed:", fanoutErr)
      }
    }
  } catch (err) {
    console.error("[audit-logger] unexpected error:", err)
  }
}

function titleForAuditAction(action: string, orderType: string, amount: unknown): string {
  if (action === "new_order") {
    const amt = typeof amount === "number" ? ` GHS ${amount.toFixed(2)}` : ""
    return `New order: ${orderType || "order"}${amt}`
  }
  if (action === "manual_wallet_topup") {
    const amt = typeof amount === "number" ? ` GHS ${amount.toFixed(2)}` : ""
    return `URGENT: Manual wallet top-up${amt}`
  }
  if (action === "agent_registered") return "New agent registered — review in Agents tab"
  if (action === "profile_photo_auto_verified") return "Agent photo auto-verified"
  if (action === "withdrawal_request") return "New withdrawal request"
  return `Admin alert: ${action}`
}

function bodyForAuditAction(action: string, newData: Record<string, unknown> | null): string | null {
  if (!newData) return null
  const parts: string[] = []
  if (typeof newData.agent_name === "string") parts.push(newData.agent_name)
  if (typeof newData.payment_reference === "string") parts.push(`ref ${newData.payment_reference}`)
  if (typeof newData.order_type === "string" && action !== "new_order") parts.push(newData.order_type)
  return parts.length ? parts.join(" · ") : null
}

export async function logAuditFromRequest(
  request: NextRequest,
  params: Omit<AuditLogParams, "ipAddress" | "userAgent">,
): Promise<void> {
  const { ipAddress, userAgent } = getRequestClientMeta(request)
  await logAudit({ ...params, ipAddress, userAgent })
}

/** Standard audit entry for a newly created order awaiting admin action. */
export async function logNewOrderAudit(params: {
  orderId: string
  orderType: string
  amount?: number | null
  actorId?: string | null
  actorType?: string
  targetTable: string
  details?: Record<string, unknown>
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<void> {
  await logAudit({
    actorId: params.actorId ?? null,
    actorType: params.actorType ?? "system",
    action: "new_order",
    severity: "warning",
    targetTable: params.targetTable,
    targetId: params.orderId,
    newData: {
      order_id: params.orderId,
      order_type: params.orderType,
      amount: params.amount ?? null,
      ...params.details,
    },
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  })
}
