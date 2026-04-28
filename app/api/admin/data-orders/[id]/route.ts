import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { authenticateAdmin } from "@/lib/api-auth"
import { cleanOrdersData, canUpdateOrderStatus } from "@/lib/bundle-data-handler"

// GET - Fetch single data order with bundle data
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: "Admin authentication required" }, { status: 401 })
    }

    const { data: order, error } = await supabase
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
      .eq("id", params.id)
      .single()

    if (error || !order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    // Clean and validate bundle data
    const [cleanedOrder] = cleanOrdersData([order])

    return NextResponse.json({
      success: true,
      data: cleanedOrder,
    })
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update order status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: "Admin authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { status, admin_message } = body

    if (!status) {
      return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 })
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
      .eq("id", params.id)
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

    if (admin_message !== undefined) {
      updateData.admin_message = admin_message
    }

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from("data_orders")
      .update(updateData)
      .eq("id", params.id)
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
      .single()

    if (updateError) {
      console.error("Error updating order status:", updateError)
      return NextResponse.json(
        { success: false, error: "Failed to update order status", details: updateError.message },
        { status: 500 },
      )
    }

    // Clean the updated order data
    const [cleanedUpdatedOrder] = cleanOrdersData([updatedOrder])

    return NextResponse.json({
      success: true,
      data: cleanedUpdatedOrder,
      message: `Order status updated to ${status}`,
    })
  } catch (error) {
    console.error("Unexpected error updating order:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete order (admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: "Admin authentication required" }, { status: 401 })
    }

    // Check if order exists
    const { data: order, error: fetchError } = await supabase
      .from("data_orders")
      .select("id, status")
      .eq("id", params.id)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    // Only allow deletion of certain statuses
    const deletableStatuses = ["pending", "canceled", "failed"]
    if (!deletableStatuses.includes(order.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot delete order with status: ${order.status}` },
        { status: 400 },
      )
    }

    // Delete the order
    const { error: deleteError } = await supabase.from("data_orders").delete().eq("id", params.id)

    if (deleteError) {
      console.error("Error deleting order:", deleteError)
      return NextResponse.json({ success: false, error: "Failed to delete order" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    })
  } catch (error) {
    console.error("Unexpected error deleting order:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
