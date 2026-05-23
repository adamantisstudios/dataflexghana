import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { recordPropertyDeal } from "@/lib/property-server"
import { isPropertyDealType } from "@/lib/property-types"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const propertyId = String(body.property_id || "").trim()
    const agentId = String(body.agent_id || "").trim()
    const dealType = String(body.deal_type || "").trim()

    if (!propertyId || !agentId) {
      return NextResponse.json(
        { success: false, error: "property_id and agent_id are required" },
        { status: 400 },
      )
    }
    if (!isPropertyDealType(dealType)) {
      return NextResponse.json({ success: false, error: "Invalid deal_type" }, { status: 400 })
    }

    const platformCommission = Number(body.platform_commission)
    if (!Number.isFinite(platformCommission) || platformCommission < 0) {
      return NextResponse.json(
        { success: false, error: "platform_commission must be a non-negative number" },
        { status: 400 },
      )
    }

    const finalPrice =
      body.final_price === null || body.final_price === undefined || body.final_price === ""
        ? null
        : Number(body.final_price)

    const agentCommission =
      body.agent_commission === null || body.agent_commission === undefined || body.agent_commission === ""
        ? 0
        : Number(body.agent_commission)

    const result = await recordPropertyDeal({
      propertyId,
      agentId,
      dealType,
      finalPrice: Number.isFinite(finalPrice as number) ? (finalPrice as number) : null,
      platformCommission,
      agentCommission: Number.isFinite(agentCommission) ? agentCommission : 0,
      notes: body.notes != null ? String(body.notes) : null,
    })

    return NextResponse.json({
      success: true,
      deal_id: result.dealId,
      agent_commission_credited: result.credited,
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to record deal" },
      { status: 500 },
    )
  }
}
