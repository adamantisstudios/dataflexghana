import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    let adminUser = null

    // Method 1: Check cookies (existing method)
    const adminCookie = request.cookies.get("admin_user")
    if (adminCookie) {
      try {
        adminUser = JSON.parse(adminCookie.value)
      } catch (parseError) {
        console.log("Failed to parse admin cookie")
      }
    }

    // Method 2: Check headers (fallback method)
    if (!adminUser) {
      const adminHeader = request.headers.get("X-Admin-Auth")
      if (adminHeader) {
        try {
          adminUser = JSON.parse(adminHeader)
        } catch (parseError) {
          console.log("Failed to parse admin header")
        }
      }
    }

    // If no admin authentication found
    if (!adminUser || !adminUser.id) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    // Verify admin exists and is active
    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("id, email, is_active")
      .eq("id", adminUser.id)
      .eq("is_active", true)
      .single()

    if (adminError || !adminData) {
      return NextResponse.json({ error: "Admin not found or inactive" }, { status: 401 })
    }

    // Fetch orders with proper error handling
    const { data, error } = await supabase
      .from("e_orders")
      .select(`
        *,
        e_products (
          title,
          image_url,
          price
        ),
        agents (
          phone_number,
          email,
          full_name
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      return NextResponse.json({ error: "Failed to fetch orders", details: error.message }, { status: 500 })
    }

    // Transform the data with null checks
    const transformedOrders = (data || []).map((order) => ({
      ...order,
      product_title: order.e_products?.title || "Unknown Product",
      product_image_url: order.e_products?.image_url || null,
      unit_price: order.e_products?.price || 0,
      agent_phone: order.agents?.phone_number || "N/A",
      agent_email: order.agents?.email || "N/A",
      agent_name: order.agent_name || order.agents?.full_name || "Unknown Agent",
    }))

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      total: transformedOrders.length,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
