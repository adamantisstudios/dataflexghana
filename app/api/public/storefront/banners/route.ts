import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { getAgentListingFeatures } from "@/lib/listing-packages-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get("agentId")?.trim()
    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 })
    }

    const features = await getAgentListingFeatures(agentId)
    if (!features.banner_slider) {
      return NextResponse.json({ success: true, banners: [] })
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("storefront_banners")
      .select("*")
      .eq("agent_id", agentId)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, banners: data || [] })
  } catch (error) {
    console.error("[public storefront banners GET]", error)
    return NextResponse.json({ error: "Failed to load banners" }, { status: 500 })
  }
}
