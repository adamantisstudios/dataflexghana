import { type NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { getRequestClientMeta, logAudit } from "@/lib/audit-logger"
import { captureStorefrontFromPaystackMetadata } from "@/lib/storefront-order-capture"
import { isWalletTopupPaystackMetadata } from "@/lib/paystack-wallet-topup"
import { verifyPaystackTransaction } from "@/lib/paystack-verify-transaction"
import { processWalletTopupPaystackSuccess } from "@/lib/wallet-topup-credit"
import { metadataValue } from "@/lib/storefront-order-whatsapp"

export const dynamic = "force-dynamic"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

/**
 * Single Paystack webhook — handles storefront orders AND agent wallet top-ups.
 * Paystack only allows one webhook URL per account.
 */
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

  const reference = String(data.reference || "")
  if (!reference) {
    return NextResponse.json({ error: "No reference" }, { status: 400 })
  }

  const clientMeta = getRequestClientMeta(request)
  const webhookMeta = (data.metadata || {}) as Record<string, unknown>

  if (isWalletTopupPaystackMetadata(webhookMeta)) {
    const verified = await verifyPaystackTransaction(reference)
    if (!verified.ok) {
      await logAudit({
        actorType: "paystack_webhook",
        action: "wallet_topup_webhook_verify_failed",
        severity: "critical",
        targetTable: "wallet_transactions",
        targetId: reference,
        newData: { reference, error: verified.error },
        ipAddress: clientMeta.ipAddress,
        userAgent: clientMeta.userAgent,
      })
      return NextResponse.json({ error: verified.error }, { status: 400 })
    }

    const result = await processWalletTopupPaystackSuccess({
      reference: verified.data.reference,
      metadata: verified.data.metadata,
      amountKobo: verified.data.amountKobo,
    })

    if (!result.ok && !result.alreadyCredited) {
      await logAudit({
        actorType: "paystack_webhook",
        action: "wallet_topup_webhook_capture_failed",
        severity: "critical",
        targetTable: "wallet_transactions",
        targetId: reference,
        newData: { reference, error: result.error, agent_id: webhookMeta.agent_id },
        ipAddress: clientMeta.ipAddress,
        userAgent: clientMeta.userAgent,
      })
      return NextResponse.json(
        { error: result.error || "Wallet credit failed" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      received: true,
      type: "wallet_topup",
      credited: result.ok,
      alreadyCredited: result.alreadyCredited,
      walletCreditGhs: result.walletCreditGhs,
    })
  }

  const source = String(metadataValue(webhookMeta, "source") || webhookMeta.source || "")
  if (source !== "storefront") {
    return NextResponse.json({ received: true, skipped: "unhandled_payment_type" })
  }

  const capture = await captureStorefrontFromPaystackMetadata({
    reference,
    metadata: webhookMeta,
    actorType: "paystack_webhook",
    ipAddress: clientMeta.ipAddress,
    userAgent: clientMeta.userAgent,
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
        order_type: webhookMeta.order_type,
        agent_id: metadataValue(webhookMeta, "agent_id"),
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
    type: "storefront",
    capture: {
      ok: capture.ok,
      alreadyRecorded: capture.alreadyRecorded,
      insertedCount: capture.insertedCount,
      orderIds: capture.orderIds,
    },
  })
}
