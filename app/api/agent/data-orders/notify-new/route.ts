import { type NextRequest, NextResponse } from "next/server"
import { logNewOrderAudit } from "@/lib/audit-logger"
import { withUnifiedAuth } from "@/lib/auth-middleware"

export const dynamic = "force-dynamic"

export const POST = withUnifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const orderId = String(body.order_id ?? body.orderId ?? "").trim()
    const orderType = String(body.order_type ?? body.orderType ?? "data_order").trim()
    const amount = body.amount != null ? Number(body.amount) : null
    const agentId = String(body.agent_id ?? user.id ?? "").trim()

    if (!orderId) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 })
    }

    if (user.role === "agent" && agentId && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    await logNewOrderAudit({
      orderId,
      orderType,
      amount,
      actorId: agentId || user.id,
      actorType: user.role === "admin" ? "admin" : "agent",
      targetTable: "data_orders",
      details: body.details && typeof body.details === "object" ? body.details : undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/agent/data-orders/notify-new]", error)
    return NextResponse.json({ error: "Failed to log new order notification" }, { status: 500 })
  }
})
