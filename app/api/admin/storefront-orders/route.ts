import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { authenticateAdmin } from "@/lib/api-auth"
import { fetchEnrichedStorefrontOrders } from "@/lib/storefront-orders"
import { countPendingStorefrontOrders } from "@/lib/storefront-order-capture"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const status = searchParams.get("status") || "all"

    const [result, pendingCount] = await Promise.all([
      fetchEnrichedStorefrontOrders({
        includeAgents: true,
        page,
        limit,
        status: status === "all" ? undefined : status,
      }),
      countPendingStorefrontOrders(),
    ])

    return NextResponse.json({ success: true, pendingCount, ...result })
  } catch (error) {
    console.error("admin storefront-orders GET:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch orders"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 })
    }

    const allowed = ["Pending", "Processing", "Completed"]
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data, error } = await db.from("storefront_orders").update({ status }).eq("id", id).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, order: data })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
