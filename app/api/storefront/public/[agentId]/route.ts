import { type NextRequest, NextResponse } from "next/server"
import { getPublicStorefrontResponse } from "@/lib/storefront-public"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  try {
    const { agentId } = await params
    const payload = await getPublicStorefrontResponse(agentId ?? "")
    return NextResponse.json(payload)
  } catch (error) {
    console.error("public storefront route:", error)
    return NextResponse.json({
      profile: null,
      bundles: [],
      services: [],
    })
  }
}
