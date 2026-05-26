import { type NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

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
}

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

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const db = getAdminClient()
    const { error } = await db.from("audit_log").insert({
      actor_id: params.actorId ?? null,
      actor_type: params.actorType,
      action: params.action,
      severity: params.severity ?? "info",
      target_table: params.targetTable ?? null,
      target_id: params.targetId ?? null,
      old_data: params.oldData ?? null,
      new_data: params.newData ?? null,
      ip_address: params.ipAddress ?? null,
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
