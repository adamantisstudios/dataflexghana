import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generatePaymentPIN } from "@/lib/pin-generator"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    const data = await request.json()
    const { agent_id, source, rows, payment_instructions } = data

    if (!agent_id || !rows || rows.length === 0) {
      return NextResponse.json({ status: "error", message: "Invalid request" }, { status: 400 })
    }

    if (rows.length > 2000) {
      return NextResponse.json(
        { status: "error", message: "Exceeded maximum of 2000 rows per submission" },
        { status: 400 },
      )
    }

    const paymentPin = generatePaymentPIN()

    const validatedRows = rows.filter((row: any) => {
      return row.phone && row.capacity_gb && row.network
    })

    const bulkOrderData = {
      agent_id,
      source,
      row_count: rows.length,
      accepted_count: validatedRows.length,
      rejected_count: rows.length - validatedRows.length,
      status: "pending_admin_review",
      payment_required: true,
      payment_instructions,
      payment_pin: paymentPin,
      created_at: new Date().toISOString(),
    }

    const { data: bulkOrder, error: orderError } = await supabase.from("bulk_orders").insert(bulkOrderData).select()

    if (orderError) {
      console.error("[v0] Bulk order error:", orderError)
      console.error("[v0] Error details:", orderError.details || orderError.message)
      return NextResponse.json(
        { status: "error", message: `Failed to create bulk order: ${orderError.message}` },
        { status: 500 },
      )
    }

    if (!bulkOrder || bulkOrder.length === 0) {
      console.error("[v0] No bulk order returned from insert")
      return NextResponse.json(
        { status: "error", message: "Failed to create bulk order - no data returned" },
        { status: 500 },
      )
    }

    const orderId = bulkOrder[0].id

    const orderItems = validatedRows.map((row: any) => ({
      bulk_order_id: orderId,
      phone: row.phone,
      network: row.network || "Unknown",
      capacity_gb: row.capacity_gb,
      status: "pending",
      created_at: new Date().toISOString(),
    }))

    const { error: itemsError } = await supabase.from("bulk_order_items").insert(orderItems)

    if (itemsError) {
      console.error("[v0] Order items error:", itemsError)
      return NextResponse.json(
        { status: "error", message: `Failed to save order items: ${itemsError.message}` },
        { status: 500 },
      )
    }

    // Create admin notification
    await supabase.from("admin_notifications").insert({
      type: "bulk_order_submission",
      agent_id,
      submission_id: orderId,
      preview: `Bulk Order with ${validatedRows.length} items from agent - PIN: ${paymentPin}`,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      status: "success",
      submission_id: orderId,
      payment_pin: paymentPin,
      accepted_count: validatedRows.length,
      rejected_count: rows.length - validatedRows.length,
      message: "Bulk order submitted successfully",
    })
  } catch (error: any) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ status: "error", message: error.message || "Unknown error occurred" }, { status: 500 })
  }
}
