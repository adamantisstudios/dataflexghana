import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const agentId = searchParams.get("agent_id")

    if (!agentId?.trim()) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    console.log("🔍 Fetching wholesale orders for agent:", agentId)

    // Use admin client to bypass RLS and fetch agent's wholesale orders
    const { data: orders, error } = await supabaseAdmin
      .from("wholesale_orders")
      .select(`
        *,
        wholesale_products(name, price, image_urls, category, delivery_time)
      `)
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching agent wholesale orders:", error)
      return NextResponse.json({ error: `Failed to fetch orders: ${error.message}` }, { status: 500 })
    }

    console.log("✅ Successfully fetched orders:", {
      agent_id: agentId,
      orders_count: orders?.length || 0,
    })

    return NextResponse.json({
      success: true,
      orders: orders || [],
    })
  } catch (error) {
    console.error("❌ Unexpected error fetching agent wholesale orders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
