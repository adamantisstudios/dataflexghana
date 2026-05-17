import { type NextRequest, NextResponse } from "next/server"
import { getPublicStorefrontPayload } from "@/lib/storefront-server"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  try {
    const { agentId } = await params
    const payload = await getPublicStorefrontPayload(agentId)

    if (!payload) {
      return NextResponse.json({ error: "Store not found or unavailable" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      profile: payload.profile,
      dataBundles: payload.dataBundles,
      referralServices: payload.referralServices,
    })
  } catch (error) {
    console.error("public storefront:", error)
    return NextResponse.json({ error: "Failed to load store" }, { status: 500 })
  }
}
