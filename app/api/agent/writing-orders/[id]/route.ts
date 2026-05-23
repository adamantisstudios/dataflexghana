import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAdminClient } from "@/lib/supabase-base"
import { creditWritingOrderCommissionIfNeeded, mapWritingOrderRow } from "@/lib/writing-server"
import { isWritingOrderStatus } from "@/lib/writing-types"

export const dynamic = "force-dynamic"

function orderIdFromPath(request: NextRequest): string {
  const parts = request.nextUrl.pathname.split("/").filter(Boolean)
  return parts[parts.length - 1] || ""
}

export const PATCH = withUnifiedAuth(async (request: NextRequest, user) => {
  try {
    const id = orderIdFromPath(request)
    const body = await request.json()
    const status = String(body.status ?? "")

    if (!isWritingOrderStatus(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    if (status !== "delivered") {
      return NextResponse.json({ error: "Agents can only mark orders as delivered" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data: existing, error: fetchErr } = await db
      .from("writing_orders")
      .select("*, writing_services(*)")
      .eq("id", id)
      .maybeSingle()

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (user.role === "agent" && String(existing.agent_id) !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (String(existing.status) !== "completed") {
      return NextResponse.json(
        { error: "Order must be completed by admin before you can mark it delivered" },
        { status: 400 },
      )
    }

    const previousStatus = String(existing.status)
    const { data, error } = await db
      .from("writing_orders")
      .update({ status: "delivered" })
      .eq("id", id)
      .select("*, writing_services(*)")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const credit = await creditWritingOrderCommissionIfNeeded(id, previousStatus, "delivered")

    return NextResponse.json({
      success: true,
      order: mapWritingOrderRow(data as Record<string, unknown>),
      commission_credited: credit.credited,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    )
  }
})
