import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAdminClient } from "@/lib/supabase-base"
import { mapFarmOrderRow, toPublicFarmListing, mapFarmListingRow } from "@/lib/farm-server"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest, user) => {
  try {
    const agentId = request.nextUrl.searchParams.get("agentId") || user.id
    if (user.role === "agent" && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("farm_orders")
      .select("*, farm_listings(*)")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const orders = (data || []).map((row) => {
      const order = mapFarmOrderRow(row as Record<string, unknown>)
      if (order.farm_listings && "farmer_name" in order.farm_listings) {
        const listing = order.farm_listings as ReturnType<typeof mapFarmListingRow>
        return {
          ...order,
          produce_name: listing.produce_name,
          listing_public: toPublicFarmListing(listing),
        }
      }
      return order
    })

    return NextResponse.json({ success: true, orders })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load orders" },
      { status: 500 },
    )
  }
})
