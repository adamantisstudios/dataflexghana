import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const { id: agentId } = await context.params
  if (!agentId) {
    return NextResponse.json({ success: false, error: "Agent ID is required" }, { status: 400 })
  }

  try {
    const db = getAdminClient()
    const { data, error } = await db
      .from("agents")
      .update({ isbanned: false })
      .eq("id", agentId)
      .select("id, full_name, isbanned, isapproved")
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Storefront reactivated.",
      agent: data,
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Reactivate failed" },
      { status: 500 },
    )
  }
}
