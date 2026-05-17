import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { fetchEnrichedStorefrontOrders } from "@/lib/storefront-orders"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest, user) => {
  try {
    const agentId = request.nextUrl.searchParams.get("agentId") || user.id
    if (user.role === "agent" && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10)
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20", 10)

    const result = await fetchEnrichedStorefrontOrders({ agentId, page, limit })
    return NextResponse.json({ success: true, ...result, orders: result.orders })
  } catch (error) {
    console.error("agent storefront-orders GET:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch orders"
    return NextResponse.json({ error: message }, { status: 500 })
  }
})
