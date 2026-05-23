import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { mapFarmOrderRow } from "@/lib/farm-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const status = request.nextUrl.searchParams.get("status")
    const db = getAdminClient()

    let query = db
      .from("farm_orders")
      .select("*, farm_listings(*), agents(full_name, phone_number)")
      .order("created_at", { ascending: false })
      .limit(200)

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    const orders = (data || []).map((row) => {
      const order = mapFarmOrderRow(row as Record<string, unknown>)
      const agent = row.agents as { full_name?: string; phone_number?: string } | null
      return {
        ...order,
        agent_name: agent?.full_name ?? null,
        agent_phone: agent?.phone_number ?? null,
      }
    })

    return NextResponse.json({ success: true, data: orders })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load orders" },
      { status: 500 },
    )
  }
}
