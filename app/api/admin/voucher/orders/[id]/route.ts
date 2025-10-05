import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const orderId = params.id
    const body = await request.json()
    const { status, note } = body

    // Validate status
    const validStatuses = ["pending", "processing", "delivered", "completed", "cancelled"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status provided" }, { status: 400 })
    }

    // Update the order status
    const { data, error } = await supabase
      .from("e_orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single()

    if (error) {
      console.error("Error updating order status:", error)
      return NextResponse.json({ error: "Failed to update order status", details: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      order: data,
      message: "Order status updated successfully",
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const orderId = params.id

    // Get order details
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
      .eq("id", orderId)
      .single()

    if (error) {
      console.error("Error fetching order:", error)
      return NextResponse.json({ error: "Failed to fetch order", details: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Transform the data
    const transformedOrder = {
      ...data,
      product_title: data.e_products?.title || "Unknown Product",
      product_image_url: data.e_products?.image_url || null,
      unit_price: data.e_products?.price || 0,
      agent_phone: data.agents?.phone_number || "N/A",
      agent_email: data.agents?.email || "N/A",
      agent_name: data.agent_name || data.agents?.full_name || "Unknown Agent",
    }

    return NextResponse.json({
      success: true,
      order: transformedOrder,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
