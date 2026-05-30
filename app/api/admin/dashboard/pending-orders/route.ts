import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { fetchPendingOrders } from "@/lib/admin-pending-orders"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const payload = await fetchPendingOrders(getAdminClient())
    return NextResponse.json(payload)
  } catch (e) {
    console.error("[admin/dashboard/pending-orders]", e)
    return NextResponse.json({ error: "Failed to fetch pending orders" }, { status: 500 })
  }
}
