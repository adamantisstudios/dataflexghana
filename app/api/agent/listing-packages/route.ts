import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import {
  countAgentProducts,
  getActiveListingPackages,
  getAgentActiveSubscription,
  agentCanListProducts,
} from "@/lib/listing-packages-server"
import { getActiveAgentFeatures } from "@/lib/listing-package-utils"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) {
    return createAuthErrorResponse(auth.error || "Agent authentication required")
  }

  const sessionAgentId = getAuthAgentId(auth)
  if (!sessionAgentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const queryAgentId = request.nextUrl.searchParams.get("agentId")?.trim() || sessionAgentId
  if (queryAgentId !== sessionAgentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const agentId = sessionAgentId

  const [packages, subscription, productCount, canList] = await Promise.all([
    getActiveListingPackages(),
    getAgentActiveSubscription(agentId),
    countAgentProducts(agentId, true),
    agentCanListProducts(agentId),
  ])

  const features = getActiveAgentFeatures(subscription)
  const maxListings = Number(features.max_listings ?? subscription?.package?.max_listings ?? 0)
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
    includes_analytics: Boolean(features.analytics ?? subscription?.package?.includes_analytics),
    features,
  })
}
