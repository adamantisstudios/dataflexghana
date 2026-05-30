import { type NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { enrichAuditEvent, maskIpAddress, type SessionEnrichment } from "@/lib/security-enrichment"

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
    }
  } catch (err) {
    console.error("[audit-logger] unexpected error:", err)
  }
}

export async function logAuditFromRequest(
  request: NextRequest,
  params: Omit<AuditLogParams, "ipAddress" | "userAgent">,
): Promise<void> {
  const { ipAddress, userAgent } = getRequestClientMeta(request)
  await logAudit({ ...params, ipAddress, userAgent })
}
