import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { authenticateAdmin } from "@/lib/api-auth"
import { cleanOrdersData, canUpdateOrderStatus } from "@/lib/bundle-data-handler"

export const dynamic = "force-dynamic"

// GET - Fetch data orders for admin with proper bundle data
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: "Admin authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agent_id")
    const status = searchParams.get("status")
    const provider = searchParams.get("provider")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Build query with proper bundle joins
    let query = supabase
      .from("data_orders")
      .select(`
        *,
        data_bundles!fk_data_orders_bundle_id (
          id,
          name,
          provider,
          size_gb,
          price,
          commission_rate,
          validity_days,
          description,
          is_active
        ),
        agents (
          id,
          full_name,
          phone_number
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (agentId) {
      query = query.eq("agent_id", agentId)
    }
    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error("Error fetching admin data orders:", error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch orders", details: error.message },
        { status: 500 },
      )
    }

    // Clean and validate bundle data
    const cleanedOrders = cleanOrdersData(orders || [])

    // Filter by provider if specified (after cleaning)
    let filteredOrders = cleanedOrders
    if (provider && provider !== "all") {
      filteredOrders = cleanedOrders.filter((order) => order.data_bundles?.provider === provider)
    }

    return NextResponse.json({
      success: true,
      data: filteredOrders,
      meta: {
        total: filteredOrders.length,
        offset,
        limit,
      },
    })
  } catch (error) {
    console.error("Unexpected error in admin data orders GET:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update data order status with bundle validation
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: "Admin authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, status, adminMessage } = body

    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: "Order ID and status are required" }, { status: 400 })
    }

    // Validate status
    const validStatuses = ["pending", "processing", "completed", "canceled", "failed"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status value" }, { status: 400 })
    }

    // Fetch current order with bundle data
    const { data: currentOrder, error: fetchError } = await supabase
      .from("data_orders")
      .select(`
        *,
        data_bundles!fk_data_orders_bundle_id (
          id,
          name,
          provider,
          size_gb,
          price,
          commission_rate,
          validity_days,
          description,
          is_active
        )
      `)
      .eq("id", orderId)
      .single()

    if (fetchError || !currentOrder) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    // Clean and validate bundle data
    const [cleanedOrder] = cleanOrdersData([currentOrder])

    // Check if status update is allowed based on bundle data
    const updateValidation = canUpdateOrderStatus(cleanedOrder, status)
    if (!updateValidation.canUpdate) {
      return NextResponse.json({ success: false, error: updateValidation.reason }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (adminMessage !== undefined) {
      updateData.admin_message = adminMessage
    }

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from("data_orders")
      .update(updateData)
      .eq("id", orderId)
      .select(`
        *,
        data_bundles!fk_data_orders_bundle_id (
          id,
          name,
          provider,
          size_gb,
          price,
          commission_rate,
          validity_days,
          description,
          is_active
        )
      `)
      .single()

    if (updateError) {
      console.error("Error updating order status:", updateError)
      return NextResponse.json({ success: false, error: "Failed to update order status" }, { status: 500 })
    }

    // Clean the updated order data
    const [cleanedUpdatedOrder] = cleanOrdersData([updatedOrder])

    return NextResponse.json({
      success: true,
      data: cleanedUpdatedOrder,
      message: `Order status updated to ${status}`,
    })
  } catch (error) {
    console.error("Unexpected error in admin data orders PUT:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
