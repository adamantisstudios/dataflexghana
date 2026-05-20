import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

/** Agent read-only list of compliance submission statuses (no customer PII). */
export const GET = withUnifiedAuth(async (request: NextRequest, user) => {
  const agentId = request.nextUrl.searchParams.get("agentId") || user.id
  if (user.role === "agent" && agentId !== user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  try {
    const db = getAdminClient()
    const { data, error } = await db
      .from("storefront_compliance_submissions")
      .select("id, form_type, status, created_at, amount_paid")
      .eq("agent_id", agentId)
      .neq("status", "paid_pending_form")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, submissions: data || [] })
  } catch (error) {
    console.error("agent compliance-submissions GET:", error)
    return NextResponse.json({ error: "Failed to load submissions" }, { status: 500 })
  }
})
