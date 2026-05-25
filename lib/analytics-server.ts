import { getAdminClient } from "@/lib/supabase-base"

export async function recordPageView(params: {
  path: string
  agentId?: string | null
  visitorIp?: string | null
  userAgent?: string | null
}) {
  const db = getAdminClient()
  const path = params.path.trim().slice(0, 500)
  if (!path) return

  await db.from("analytics_page_views").insert({
    path,
    agent_id: params.agentId || null,
    visitor_ip: params.visitorIp || null,
    user_agent: params.userAgent?.slice(0, 500) || null,
  })
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.toISOString()
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return startOfDay(d)
}

export async function getAnalyticsDashboardData() {
  const db = getAdminClient()
  const now = new Date()
  const todayStart = startOfDay(now)
  const weekStart = daysAgo(7)
  const monthStart = daysAgo(30)

  const { data: allViews } = await db
    .from("analytics_page_views")
    .select("path, agent_id, created_at")
    .gte("created_at", monthStart)
    .order("created_at", { ascending: false })
    .limit(50000)

  const views = allViews || []

  const countSince = (iso: string) =>
    views.filter((v) => v.created_at && v.created_at >= iso).length

  const visitsToday = countSince(todayStart)
  const visitsWeek = countSince(weekStart)
  const visitsMonth = views.length

  const dayCounts = new Map<string, number>()
  for (const v of views) {
    if (!v.created_at) continue
    const day = v.created_at.slice(0, 10)
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1)
  }
  const peakDays = [...dayCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([date, count]) => ({ date, count }))

  const pathCounts = new Map<string, number>()
  for (const v of views) {
    const p = v.path || "/"
    pathCounts.set(p, (pathCounts.get(p) || 0) + 1)
  }
  const topPaths = [...pathCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }))

  const agentCounts = new Map<string, number>()
  for (const v of views) {
    if (!v.agent_id) continue
    agentCounts.set(v.agent_id, (agentCounts.get(v.agent_id) || 0) + 1)
  }
  const topAgentIds = [...agentCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const agentIds = topAgentIds.map(([id]) => id)
  const { data: agents } = await db
    .from("agents")
    .select("id, full_name, last_login_at")
    .in("id", agentIds.length ? agentIds : ["00000000-0000-0000-0000-000000000000"])

  const agentMap = new Map((agents || []).map((a) => [a.id, a]))

  const topAgents = topAgentIds.map(([id, views_count]) => ({
    agent_id: id,
    full_name: agentMap.get(id)?.full_name || "Unknown",
    views_count,
  }))

  const { data: recentLogins } = await db
    .from("agents")
    .select("id, full_name, last_login_at")
    .not("last_login_at", "is", null)
    .order("last_login_at", { ascending: false })
    .limit(15)

  const { data: auditLogins } = await db
    .from("audit_log")
    .select("actor_id, action, created_at")
    .ilike("action", "%login%")
    .order("created_at", { ascending: false })
    .limit(20)

  return {
    visitsToday,
    visitsWeek,
    visitsMonth,
    peakDays,
    topPaths,
    topAgents,
    recentLogins: recentLogins || [],
    auditLogins: auditLogins || [],
  }
}
