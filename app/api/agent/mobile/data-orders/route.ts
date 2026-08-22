import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { createManualDataOrder } from "@/lib/agent-mobile"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string; full_name?: string }
  let body: { bundle_id?: string; recipient_phone?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.bundle_id?.trim()) {
    return NextResponse.json({ error: "bundle_id is required" }, { status: 400 })
  }

  const result = await createManualDataOrder({
    agentId: agent.id,
    agentName: agent.full_name,
    bundleId: body.bundle_id.trim(),
    recipientPhone: body.recipient_phone || "",
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    success: true,
    order: result.order,
    bundle: result.bundle,
    payment: result.payment,
  })
}
