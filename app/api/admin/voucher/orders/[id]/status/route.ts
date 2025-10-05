import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    let adminUser

    // First try cookie authentication
    const adminCookie = request.cookies.get("admin_user")
    if (adminCookie) {
      try {
        adminUser = JSON.parse(adminCookie.value)
      } catch (parseError) {
        // Continue to header check
      }
    }

    // If no cookie auth, try header authentication
    if (!adminUser) {
      const authHeader = request.headers.get("X-Admin-Auth")
      if (authHeader) {
        try {
          adminUser = JSON.parse(authHeader)
        } catch (parseError) {
          return NextResponse.json({ error: "Invalid admin authentication format" }, { status: 401 })
        }
      }
    }

    // If no authentication found
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

    const { id } = params
    const body = await request.json()
    const { status } = body

    // Validate required fields
    if (!status) {
      return NextResponse.json({ error: "Missing required field: status" }, { status: 400 })
    }

    // Validate status
    const validStatuses = ["pending", "processing", "delivered", "completed", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Call the update_order_status function with authenticated admin ID
    const { data, error } = await supabase.rpc("update_order_status", {
      p_order_id: id,
      p_new_status: status,
      p_admin_id: adminUser.id,
    })

    if (error) {
      console.error("Error updating order status:", error)
      return NextResponse.json({ error: error.message || "Failed to update order status" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
