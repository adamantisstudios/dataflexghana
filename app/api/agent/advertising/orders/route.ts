import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAdminClient } from "@/lib/supabase-base"
import { mapAdPackageRow } from "@/lib/advertising-server"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest, user) => {
  try {
    const agentId = request.nextUrl.searchParams.get("agentId") || user.id
    if (user.role === "agent" && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10))
    const limit = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "20", 10)))
    const from = (page - 1) * limit
    const to = from + limit - 1

    const db = getAdminClient()
    const { data, error, count } = await db
      .from("ad_orders")
      .select("*, ad_packages(*)", { count: "exact" })
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const orders = (data || []).map((row) => ({
      id: row.id,
      customer_name: row.customer_name,
      customer_phone: row.customer_phone,
      total_paid: Number(row.total_paid),
      status: row.status,
      created_at: row.created_at,
      paystack_reference: row.paystack_reference,
      package_name: row.ad_packages?.package_name ?? "Advertising",
      station_name: row.ad_packages?.station_name ?? "",
      media_type: row.ad_packages?.media_type ?? "other",
      agent_commission: Number(row.ad_packages?.agent_commission ?? 0),
      ad_packages: row.ad_packages ? mapAdPackageRow(row.ad_packages as Record<string, unknown>) : null,
    }))

    return NextResponse.json({
      success: true,
      orders,
      page,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
      total: count ?? 0,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load orders" },
      { status: 500 },
    )
  }
})
