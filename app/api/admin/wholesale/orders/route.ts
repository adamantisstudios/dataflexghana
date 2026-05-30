import { requireAdminSession } from "@/lib/api-auth"
import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {

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
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {

    const body = await request.json()

    const { orderId, status, adminNotes, commissionPaid } = body

    if (!orderId?.trim()) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }


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


    const updates: any = {}
    if (status) updates.status = status
    if (adminNotes !== undefined) updates.admin_notes = adminNotes

    if (commissionPaid !== undefined) {
      const finalStatus = status || currentOrder.status
      const validCommissionStatuses = ["completed", "delivered"]

      if (commissionPaid === true && !validCommissionStatuses.includes(finalStatus)) {
        return NextResponse.json(
          {
            error: `Cannot mark commission as paid unless order status is 'completed' or 'delivered'. Current status: '${finalStatus}'`,
          },
          { status: 400 },
        )
      }
      updates.commission_paid = commissionPaid
    }


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
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }


    const completionStatuses = ["completed", "delivered"]
    const wasCompleted = completionStatuses.includes(currentOrder.status)
    const isNowCompleted = status && completionStatuses.includes(status)

    if (!wasCompleted && isNowCompleted) {

      try {
        const { handleWholesaleOrderStatusChange } = await import("@/lib/order-status-handlers")
        const commissionResult = await handleWholesaleOrderStatusChange(orderId, currentOrder.status, status, "admin")

        if (commissionResult.success) {

          if (commissionResult.commissionChange?.action === "created") {
            await supabaseAdmin.from("wholesale_orders").update({ commission_paid: true }).eq("id", orderId)

          }
        } else {
          console.error("❌ Failed to trigger wholesale commission:", commissionResult.message)
        }
      } catch (commissionError) {
        console.error("❌ Error triggering wholesale commission:", commissionError)
      }
    }


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
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId?.trim()) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }


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
