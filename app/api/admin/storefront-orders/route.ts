import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { authenticateAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const db = getAdminClient()
  const { data, error } = await db
    .from("storefront_orders")
    .select(`*, data_bundles (name, provider, size_gb), agents (full_name, phone_number)`)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: profiles } = await db
    .from("agent_store_profiles")
    .select("agent_id, store_name, storefront_commission_balance")

  return NextResponse.json({
    orders: data || [],
    profiles: profiles || [],
  })
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
