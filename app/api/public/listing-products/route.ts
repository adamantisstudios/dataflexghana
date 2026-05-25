import { type NextRequest, NextResponse } from "next/server"
import { getPublicAgentProducts } from "@/lib/listing-packages-server"
import { resolveStoreSegmentToAgentId } from "@/lib/storefront-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const agentIdParam = request.nextUrl.searchParams.get("agentId")?.trim()
    const segment = request.nextUrl.searchParams.get("segment")?.trim()
    let agentId = agentIdParam || ""

    if (!agentId && segment) {
      agentId = (await resolveStoreSegmentToAgentId(segment)) || ""
    }

    if (!agentId) {
      return NextResponse.json({ error: "agentId or segment required" }, { status: 400 })
    }

    const products = await getPublicAgentProducts(agentId)
    return NextResponse.json({ success: true, products })
  } catch (e) {
    console.error("[public listing-products]", e)
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 })
  }
}
