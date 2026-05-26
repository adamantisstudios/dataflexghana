import { type NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { getRequestClientMeta, logAudit } from "@/lib/audit-logger"
import { captureStorefrontFromPaystackMetadata } from "@/lib/storefront-order-capture"
import { metadataValue } from "@/lib/storefront-order-whatsapp"

export const dynamic = "force-dynamic"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

/** Paystack server webhook — backup capture when browser callback/confirm fails. */
export async function POST(request: NextRequest) {
  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 })
  }

  const signature = request.headers.get("x-paystack-signature")
  const rawBody = await request.text()

  const expected = createHmac("sha512", PAYSTACK_SECRET_KEY).update(rawBody).digest("hex")
  if (!signature || signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: { event?: string; data?: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true })
  }

  const data = (event.data || {}) as Record<string, unknown>
  const status = String(data.status || "")
  if (status !== "success") {
    return NextResponse.json({ received: true })
  }

  const meta = (data.metadata || {}) as Record<string, unknown>
  const source = String(metadataValue(meta, "source") || meta.source || "")
  if (source !== "storefront") {
    return NextResponse.json({ received: true, skipped: "not_storefront" })
  }

  const reference = String(data.reference || "")
  if (!reference) {
    return NextResponse.json({ error: "No reference" }, { status: 400 })
  }

  const clientMeta = getRequestClientMeta(request)
  const capture = await captureStorefrontFromPaystackMetadata({
    reference,
    metadata: meta,
    actorType: "paystack_webhook",
    ipAddress: clientMeta.ipAddress,
    userAgent: clientMeta.userAgent,
  })

  console.info("[storefront webhook] charge.success", {
    reference,
    ok: capture.ok,
    alreadyRecorded: capture.alreadyRecorded,
    insertedCount: capture.insertedCount,
    error: capture.error,
    orderType: meta.order_type,
  })

  if (!capture.ok && !capture.alreadyRecorded) {
    await logAudit({
      actorType: "paystack_webhook",
      action: "storefront_webhook_capture_failed",
      severity: "critical",
      targetTable: "storefront_orders",
      targetId: reference,
      newData: {
        reference,
        error: capture.error,
        order_type: meta.order_type,
        agent_id: metadataValue(meta, "agent_id"),
      },
      ipAddress: clientMeta.ipAddress,
      userAgent: clientMeta.userAgent,
    })
    return NextResponse.json(
      { error: capture.error || "Order capture failed" },
      { status: 500 },
    )
  }

  return NextResponse.json({
    received: true,
    capture: {
      ok: capture.ok,
      alreadyRecorded: capture.alreadyRecorded,
      insertedCount: capture.insertedCount,
      orderIds: capture.orderIds,
    },
  })
}
