import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { createAgentDataOrder, listAgentDataOrders } from "@/lib/agent-mobile"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string }
  const { searchParams } = request.nextUrl

  try {
    const orders = await listAgentDataOrders({
      agentId: agent.id,
      status: searchParams.get("status"),
      provider: searchParams.get("provider"),
      search: searchParams.get("q"),
      limit: Number(searchParams.get("limit") || 50),
    })
    return NextResponse.json({ success: true, orders })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load orders"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string; full_name?: string }
  let body: { bundle_id?: string; recipient_phone?: string; payment_method?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.bundle_id?.trim()) {
    return NextResponse.json({ error: "bundle_id is required" }, { status: 400 })
  }

  const result = await createAgentDataOrder({
    agentId: agent.id,
    agentName: agent.full_name,
    bundleId: body.bundle_id.trim(),
    recipientPhone: body.recipient_phone || "",
    paymentMethod: body.payment_method === "wallet" ? "wallet" : "manual",
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        code: "code" in result ? result.code : undefined,
        required: "required" in result ? result.required : undefined,
        available: "available" in result ? result.available : undefined,
      },
      { status: result.status },
    )
  }

  return NextResponse.json({
    success: true,
    order: result.order,
    bundle: result.bundle,
    payment: result.payment,
  })
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string }
  const id = request.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const db = getAdminClient()
  const { data: existing } = await db
    .from("data_orders")
    .select("id, status, agent_id")
    .eq("id", id)
    .eq("agent_id", agent.id)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 })
  if (existing.status === "processing") {
    return NextResponse.json({ error: "Cannot delete an order that is processing" }, { status: 400 })
  }

  const { error } = await db.from("data_orders").delete().eq("id", id).eq("agent_id", agent.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
