import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { mapAdPackageRow } from "@/lib/advertising-server"
import type { AdOrder } from "@/lib/advertising-types"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const status = request.nextUrl.searchParams.get("status")?.trim()
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10))
    const limit = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "20", 10)))
    const from = (page - 1) * limit
    const to = from + limit - 1

    const db = getAdminClient()
    let query = db
      .from("ad_orders")
      .select("*, ad_packages(*), agents(full_name, phone_number)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to)

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const rows: AdOrder[] = (data || []).map((row) => {
      const pkg = row.ad_packages
      const agent = row.agents
      return {
        id: row.id,
        package_id: row.package_id,
        agent_id: row.agent_id,
        customer_name: row.customer_name,
        customer_phone: row.customer_phone,
        customer_email: row.customer_email,
        customer_business: row.customer_business,
        ad_message: row.ad_message,
        total_paid: Number(row.total_paid),
        paystack_reference: row.paystack_reference,
        status: row.status,
        admin_notes: row.admin_notes,
        created_at: row.created_at,
        ad_packages: pkg ? mapAdPackageRow(pkg as Record<string, unknown>) : null,
        agents: agent
          ? { full_name: String(agent.full_name), phone_number: String(agent.phone_number) }
          : null,
      }
    })

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load orders" },
      { status: 500 },
    )
  }
}
