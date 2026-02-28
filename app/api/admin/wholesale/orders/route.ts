import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 Admin API: Fetching all wholesale orders...")

    // Use admin client to bypass RLS and fetch ALL wholesale orders
    const { data: orders, error } = await supabaseAdmin
      .from("wholesale_orders")
      .select(`
        *,
        agents(full_name, phone_number, momo_number, region),
        wholesale_products(name, price, image_urls, category, delivery_time, commission_value)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Admin API: Error fetching wholesale orders:", error)
      return NextResponse.json({ error: `Failed to fetch orders: ${error.message}` }, { status: 500 })
    }

    console.log("✅ Admin API: Successfully fetched orders:", {
      orders_count: orders?.length || 0,
      sample_orders:
        orders?.slice(0, 3).map((o) => ({
          id: o.id,
          status: o.status,
          agent: o.agents?.full_name,
          product: o.wholesale_products?.name,
        })) || [],
    })

    return NextResponse.json({
      success: true,
      orders: orders || [],
    })
  } catch (error) {
    console.error("❌ Admin API: Unexpected error fetching wholesale orders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("🔄 Admin API PUT: Request received")

    const body = await request.json()
    console.log("🔄 Admin API PUT: Request body parsed:", body)

    const { orderId, status, adminNotes, commissionPaid } = body

    if (!orderId?.trim()) {
      console.log("❌ Admin API PUT: Missing orderId")
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    console.log("🔄 Admin API: Updating wholesale order:", { orderId, status, commissionPaid })

    console.log("🔄 Admin API: Fetching current order from database...")
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from("wholesale_orders")
      .select("status, agent_id, commission_amount, commission_paid")
      .eq("id", orderId)
      .single()

    if (fetchError) {
      console.error("❌ Admin API: Error fetching current order:", {
        error: fetchError,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        code: fetchError.code,
      })
      return NextResponse.json({ error: `Failed to fetch current order: ${fetchError.message}` }, { status: 500 })
    }

    console.log("✅ Admin API: Current order fetched:", currentOrder)

    const updates: any = {}
    if (status) updates.status = status
    if (adminNotes !== undefined) updates.admin_notes = adminNotes

    if (commissionPaid !== undefined) {
      const finalStatus = status || currentOrder.status
      const validCommissionStatuses = ["completed", "delivered"]

      if (commissionPaid === true && !validCommissionStatuses.includes(finalStatus)) {
        console.log("❌ Admin API: Invalid commission status combination:", { finalStatus, commissionPaid })
        return NextResponse.json(
          {
            error: `Cannot mark commission as paid unless order status is 'completed' or 'delivered'. Current status: '${finalStatus}'`,
          },
          { status: 400 },
        )
      }
      updates.commission_paid = commissionPaid
    }

    console.log("🔄 Admin API: Applying updates:", updates)

    // Use admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("wholesale_orders")
      .update(updates)
      .eq("id", orderId)
      .select(`
        *,
        agents(full_name, phone_number, momo_number, region),
        wholesale_products(name, price, image_urls, category, delivery_time, commission_value)
      `)
      .single()

    if (error) {
      console.error("❌ Admin API: Error updating wholesale order:", {
        error: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        updates: updates,
      })
      return NextResponse.json({ error: `Failed to update order: ${error.message}` }, { status: 500 })
    }

    if (!data) {
      console.log("❌ Admin API: Order not found after update")
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    console.log("✅ Admin API: Order updated successfully:", { orderId, newStatus: data.status })

    const completionStatuses = ["completed", "delivered"]
    const wasCompleted = completionStatuses.includes(currentOrder.status)
    const isNowCompleted = status && completionStatuses.includes(status)

    if (!wasCompleted && isNowCompleted) {
      console.log("🎯 Wholesale order status changed to completion status, triggering commission:", {
        orderId,
        oldStatus: currentOrder.status,
        newStatus: status,
        commissionAmount: currentOrder.commission_amount,
      })

      try {
        const { handleWholesaleOrderStatusChange } = await import("@/lib/order-status-handlers")
        const commissionResult = await handleWholesaleOrderStatusChange(orderId, currentOrder.status, status, "admin")

        if (commissionResult.success) {
          console.log("✅ Wholesale commission triggered successfully:", commissionResult)

          if (commissionResult.commissionChange?.action === "created") {
            await supabaseAdmin.from("wholesale_orders").update({ commission_paid: true }).eq("id", orderId)

            console.log("✅ Commission automatically marked as paid for order:", orderId)
          }
        } else {
          console.error("❌ Failed to trigger wholesale commission:", commissionResult.message)
        }
      } catch (commissionError) {
        console.error("❌ Error triggering wholesale commission:", commissionError)
      }
    }

    console.log("✅ Admin API: Successfully updated order:", { orderId, updates })

    return NextResponse.json({
      success: true,
      order: data,
    })
  } catch (error) {
    console.error("❌ Admin API: Unexpected error updating wholesale order:", {
      error: error,
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId?.trim()) {
      console.log("❌ Admin API DELETE: Missing orderId")
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    console.log("🔄 Admin API: Deleting wholesale order:", orderId)

    // Use admin client to bypass RLS
    const { error } = await supabaseAdmin.from("wholesale_orders").delete().eq("id", orderId)

    if (error) {
      console.error("❌ Admin API: Error deleting wholesale order:", {
        error: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return NextResponse.json({ error: `Failed to delete order: ${error.message}` }, { status: 500 })
    }

    console.log("✅ Admin API: Successfully deleted order:", orderId)

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    })
  } catch (error) {
    console.error("❌ Admin API: Unexpected error deleting wholesale order:", {
      error: error,
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
