import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { authenticateAdmin } from "@/lib/api-auth"
import { logAudit } from "@/lib/audit-logger"
import {
  buildSevenDayWarningMessage,
  buildThreeDayWarningMessage,
  hasNoOrdersInPast7Days,
  isBelowOrderQuota,
  ordersNeededForQuota,
} from "@/lib/agent-deactivation"

export const dynamic = "force-dynamic"

const WARNING_COOLDOWN_DAYS = 14
const DAYS_BETWEEN_7D_AND_3D_WARNING = 4

type AgentRow = {
  id: string
  full_name: string
  phone_number: string
  isapproved: boolean
  isbanned: boolean
  auto_deactivated_at: string | null
  warned_at: string | null
  data_orders_count_7d: number | null
  data_orders_count_30d: number | null
}

async function hasRecentAuditAction(
  agentId: string,
  action: string,
  sinceIso: string,
): Promise<boolean> {
  const db = getAdminClient()
  const { count, error } = await db
    .from("audit_log")
    .select("*", { count: "exact", head: true })
    .eq("target_id", agentId)
    .eq("action", action)
    .gte("created_at", sinceIso)

  if (error) {
    console.error("[send-deactivation-warnings] audit check:", error)
    return false
  }
  return (count ?? 0) > 0
}

async function sendInAppNotification(
  agentId: string,
  title: string,
  message: string,
  templateName: string,
): Promise<boolean> {
  const db = getAdminClient()
  const now = new Date()
  const end = new Date(now)
  end.setDate(end.getDate() + 14)

  const row: Record<string, unknown> = {
    title,
    message,
    start_date: now.toISOString(),
    end_date: end.toISOString(),
    frequency: "always",
    template_name: templateName,
    is_active: true,
    target_agent_id: agentId,
  }

  const { error } = await db.from("agent_notifications").insert(row)

  if (error) {
    // Fallback if target_agent_id column missing: broadcast-style notification
    if (error.message?.includes("target_agent_id")) {
      const { error: fallbackError } = await db.from("agent_notifications").insert({
        title: `[${agentId.slice(0, 8)}] ${title}`,
        message,
        start_date: now.toISOString(),
        end_date: end.toISOString(),
        frequency: "always",
        template_name: templateName,
        is_active: true,
      })
      return !fallbackError
    }
    console.error("[send-deactivation-warnings] notification insert:", error)
    return false
  }
  return true
}

export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get("x-cron-secret")
    const allowedCron =
      Boolean(process.env.CRON_SECRET) && cronSecret === process.env.CRON_SECRET

    if (!allowedCron) {
      const auth = await authenticateAdmin(request)
      if (!auth.success) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
      }
    }

    const db = getAdminClient()
    const cooldownSince = new Date(
      Date.now() - WARNING_COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString()

    const { data: agents, error: agentsError } = await db
      .from("agents")
      .select(
        "id, full_name, phone_number, isapproved, isbanned, auto_deactivated_at, warned_at, data_orders_count_7d, data_orders_count_30d",
      )
      .eq("isapproved", true)
      .eq("isbanned", false)
      .is("auto_deactivated_at", null)
      .is("deleted_at", null)

    if (agentsError) {
      // Retry without deleted_at filter if column not migrated yet
      const { data: fallbackAgents, error: fallbackError } = await db
        .from("agents")
        .select(
          "id, full_name, phone_number, isapproved, isbanned, auto_deactivated_at, warned_at, data_orders_count_7d, data_orders_count_30d",
        )
        .eq("isapproved", true)
        .eq("isbanned", false)
        .is("auto_deactivated_at", null)

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 })
      }
      return processWarnings(fallbackAgents as AgentRow[], cooldownSince)
    }

    return processWarnings((agents || []) as AgentRow[], cooldownSince)
  } catch (error) {
    console.error("[send-deactivation-warnings]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send warnings" },
      { status: 500 },
    )
  }
}

async function processWarnings(agents: AgentRow[], cooldownSince: string) {
  const results = {
    scanned: agents.length,
    warnings_7d: 0,
    warnings_3d: 0,
    skipped: 0,
    errors: [] as string[],
  }

  const db = getAdminClient()
  const nowIso = new Date().toISOString()

  for (const agent of agents) {
    if (!isBelowOrderQuota(agent) || !hasNoOrdersInPast7Days(agent)) {
      results.skipped++
      continue
    }

    const ordersNeeded = ordersNeededForQuota(agent)
    const had7dRecently = await hasRecentAuditAction(
      agent.id,
      "deactivation_warning_7d",
      cooldownSince,
    )
    const had3dRecently = await hasRecentAuditAction(
      agent.id,
      "deactivation_warning_3d",
      cooldownSince,
    )

    // 7-day warning: at risk, no 7d warning in cooldown period
    if (!had7dRecently) {
      const { title, message } = buildSevenDayWarningMessage(ordersNeeded)
      const notified = await sendInAppNotification(
        agent.id,
        title,
        message,
        `deactivation_warning_7d_${agent.id}`,
      )

      await db.from("agents").update({ warned_at: nowIso, updated_at: nowIso }).eq("id", agent.id)

      await logAudit({
        actorId: null,
        actorType: "system",
        action: "deactivation_warning_7d",
        targetTable: "agents",
        targetId: agent.id,
        newData: { title, message, in_app: notified, orders_needed: ordersNeeded },
      })

      results.warnings_7d++
      continue
    }

    // 3-day warning: already had 7d warning ≥4 days ago, no 3d warning in cooldown
    const sevenDayAuditSince = new Date(
      Date.now() - DAYS_BETWEEN_7D_AND_3D_WARNING * 24 * 60 * 60 * 1000,
    ).toISOString()

    const { data: sevenDayLogs } = await db
      .from("audit_log")
      .select("created_at")
      .eq("target_id", agent.id)
      .eq("action", "deactivation_warning_7d")
      .order("created_at", { ascending: false })
      .limit(1)

    const last7dSent = sevenDayLogs?.[0]?.created_at
    const sevenDayOldEnough =
      last7dSent && new Date(last7dSent).getTime() <= new Date(sevenDayAuditSince).getTime()

    const warnedAtOldEnough =
      agent.warned_at &&
      Date.now() - new Date(agent.warned_at).getTime() >=
        DAYS_BETWEEN_7D_AND_3D_WARNING * 24 * 60 * 60 * 1000

    if (!had3dRecently && (sevenDayOldEnough || warnedAtOldEnough)) {
      const { title, message } = buildThreeDayWarningMessage(ordersNeeded)
      const notified = await sendInAppNotification(
        agent.id,
        title,
        message,
        `deactivation_warning_3d_${agent.id}`,
      )

      await db.from("agents").update({ warned_at: nowIso, updated_at: nowIso }).eq("id", agent.id)

      await logAudit({
        actorId: null,
        actorType: "system",
        action: "deactivation_warning_3d",
        targetTable: "agents",
        targetId: agent.id,
        newData: { title, message, in_app: notified, orders_needed: ordersNeeded },
      })

      results.warnings_3d++
    } else {
      results.skipped++
    }
  }

  return NextResponse.json({
    success: true,
    message: `Processed ${results.scanned} agents. Sent ${results.warnings_7d} seven-day and ${results.warnings_3d} three-day warnings.`,
    ...results,
  })
}
