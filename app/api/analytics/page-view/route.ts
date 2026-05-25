import { type NextRequest, NextResponse } from "next/server"
import { getClientIp, getClientUserAgent } from "@/lib/audit-logger"
import { recordPageView } from "@/lib/analytics-server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const path = String(body.path ?? "").trim()
    if (!path || path.length > 500) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 })
    }

    const agentId = body.agent_id ? String(body.agent_id).trim() : null

    await recordPageView({
      path,
      agentId: agentId || null,
      visitorIp: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[analytics page-view]", e)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
