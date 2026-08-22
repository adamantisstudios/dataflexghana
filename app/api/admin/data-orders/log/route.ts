import { getAdminClient } from "@/lib/supabase-base"
import { type NextRequest, NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-logger"
import { notifyAdminOps } from "@/lib/ops/notify-admin-ops"

/** Public POST: no-registration and guest MoMo orders log here (service role insert). */
export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    const data = await request.json()

    if (!data.network) {
      return NextResponse.json({ success: false, message: "Missing network field" }, { status: 400 })
    }
    if (!data.data_bundle) {
      return NextResponse.json({ success: false, message: "Missing data_bundle field" }, { status: 400 })
    }
    if (!data.amount) {
      return NextResponse.json({ success: false, message: "Missing amount field" }, { status: 400 })
    }
    if (!data.phone_number) {
      return NextResponse.json({ success: false, message: "Missing phone_number field" }, { status: 400 })
    }
    if (!data.reference_code) {
      return NextResponse.json({ success: false, message: "Missing reference_code field" }, { status: 400 })
    }
    if (!data.payment_method) {
      return NextResponse.json({ success: false, message: "Missing payment_method field" }, { status: 400 })
    }

    const amount = parseFloat(data.amount)
    const insertData = {
      network: data.network,
      data_bundle: data.data_bundle,
      amount,
      phone_number: data.phone_number,
      reference_code: data.reference_code,
      payment_method: data.payment_method,
    }

    const { data: result, error } = await supabase.from("data_orders_log").insert([insertData]).select()

    if (error) {
      console.error("[data-orders/log] insert error:", JSON.stringify(error, null, 2))
      return NextResponse.json(
        { success: false, message: "Failed to log order", error: error.message },
        { status: 500 },
      )
    }

    const row = result?.[0]
    const orderId = row?.id ? String(row.id) : null

    try {
      await logAudit({
        actorId: null,
        actorType: "guest",
        action: "guest_order_logged",
        severity: "info",
        targetTable: "data_orders_log",
        targetId: orderId,
        newData: {
          order_type: "guest_data_order",
          network: data.network,
          data_bundle: data.data_bundle,
          amount,
          phone_number: data.phone_number,
          payment_reference: data.reference_code,
          payment_method: data.payment_method,
          href_tab: "data-orders-log",
        },
      })
    } catch (e) {
      console.error("[data-orders/log] audit fan-out failed:", e)
    }

    try {
      await notifyAdminOps({
        category: "orders",
        severity: "warning",
        title: `Guest / no-reg order: ${data.network} GHS ${amount.toFixed(2)}`,
        body: `${data.data_bundle} · ${data.phone_number} · ref ${data.reference_code} · ${data.payment_method}`,
        deeplinkTab: "data-orders-log",
        entityType: "data_orders_log",
        entityId: orderId,
        requiresAck: true,
        source: "guest_order",
        payload: {
          ...insertData,
          order_id: orderId,
        },
      })
    } catch (e) {
      console.error("[data-orders/log] ops inbox fan-out failed:", e)
    }

    return NextResponse.json(
      { success: true, message: "Order logged successfully", data: row },
      { status: 200 },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred"
    console.error("[data-orders/log] API error:", error)
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
