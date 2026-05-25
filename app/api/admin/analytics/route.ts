import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAnalyticsDashboardData } from "@/lib/analytics-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const data = await getAnalyticsDashboardData()
    return NextResponse.json({ success: true, ...data })
  } catch (e) {
    console.error("[admin analytics]", e)
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 })
  }
}
