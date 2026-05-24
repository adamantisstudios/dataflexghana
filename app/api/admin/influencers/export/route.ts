import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { parseSocialHandles } from "@/lib/influencer-types"

export const dynamic = "force-dynamic"

function escapeCsv(val: string) {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const db = getAdminClient()
  const { data: profiles } = await db.from("influencer_profiles").select("*")
  const { data: packages } = await db.from("influencer_packages").select("id, profile_id")
  const { data: orders } = await db
    .from("influencer_orders")
    .select("agent_id, influencer_payout, status")

  const agentIds = [...new Set((profiles || []).map((p) => p.agent_id))]
  const { data: agents } = await db
    .from("agents")
    .select("id, full_name, phone_number")
    .in("id", agentIds.length ? agentIds : ["00000000-0000-0000-0000-000000000000"])

  const agentMap = new Map((agents || []).map((a) => [a.id, a]))

  const pkgCountByProfile = new Map<string, number>()
  for (const p of packages || []) {
    pkgCountByProfile.set(p.profile_id, (pkgCountByProfile.get(p.profile_id) || 0) + 1)
  }

  const orderStatsByAgent = new Map<string, { count: number; earnings: number }>()
  for (const o of orders || []) {
    const cur = orderStatsByAgent.get(o.agent_id) || { count: 0, earnings: 0 }
    cur.count += 1
    if (o.status === "completed") {
      cur.earnings += Number(o.influencer_payout)
    }
    orderStatsByAgent.set(o.agent_id, cur)
  }

  const headers = [
    "Name",
    "Phone",
    "Niche",
    "Audience Size",
    "Social Handles",
    "Approved",
    "Package Count",
    "Total Orders",
    "Total Earnings (GHS)",
  ]

  const lines = [headers.join(",")]

  for (const p of profiles || []) {
    const agent = agentMap.get(p.agent_id)
    const handles = parseSocialHandles(p.social_handles)
    const handlesStr = Object.entries(handles)
      .map(([k, v]) => `${k}: ${v}`)
      .join("; ")
    const stats = orderStatsByAgent.get(p.agent_id) || { count: 0, earnings: 0 }
    const row = [
      escapeCsv(agent?.full_name ?? ""),
      escapeCsv(agent?.phone_number ?? ""),
      escapeCsv(p.niche ?? ""),
      String(p.audience_size ?? 0),
      escapeCsv(handlesStr),
      p.approved ? "Yes" : "No",
      String(pkgCountByProfile.get(p.id) || 0),
      String(stats.count),
      stats.earnings.toFixed(2),
    ]
    lines.push(row.join(","))
  }

  const csv = lines.join("\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="influencers-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
