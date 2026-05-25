import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import {
  countAgentProducts,
  getActiveListingPackages,
  getAgentActiveSubscription,
  agentCanListProducts,
} from "@/lib/listing-packages-server"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest, user) => {
  const agentId = request.nextUrl.searchParams.get("agentId") || user.id
  if (user.role === "agent" && agentId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [packages, subscription, productCount, canList] = await Promise.all([
    getActiveListingPackages(),
    getAgentActiveSubscription(agentId),
    countAgentProducts(agentId, true),
    agentCanListProducts(agentId),
  ])

  const maxListings = subscription?.package?.max_listings ?? 0
  const daysRemaining =
    subscription?.expires_at != null
      ? Math.max(
          0,
          Math.ceil(
            (new Date(subscription.expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
          ),
        )
      : 0

  return NextResponse.json({
    success: true,
    packages,
    subscription,
    can_list_products: canList,
    listings_used: productCount,
    max_listings: maxListings,
    days_remaining: daysRemaining,
    includes_analytics: Boolean(subscription?.package?.includes_analytics),
  })
})
