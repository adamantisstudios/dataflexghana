import { type NextRequest, NextResponse } from "next/server"
import { getRequestClientMeta } from "@/lib/audit-logger"
import {
  captureStorefrontFromPaystackMetadata,
} from "@/lib/storefront-order-capture"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export const dynamic = "force-dynamic"

/** Client fallback after Paystack redirect — idempotent order capture by payment reference. */
export async function POST(request: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 500 })
    }

    const body = await request.json()
    const reference = String(body.reference || "").trim()
    const agentIdHint = body.agent_id ? String(body.agent_id).trim() : ""

    if (!reference) {
      return NextResponse.json({ error: "reference is required" }, { status: 400 })
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } },
    )
    const verifyData = await verifyRes.json()

    if (!verifyRes.ok || verifyData.data?.status !== "success") {
      return NextResponse.json(
        { error: verifyData.message || "Payment not verified" },
        { status: 400 },
      )
    }

    const verifiedReference = String(verifyData.data.reference || reference)
    const meta = (verifyData.data.metadata || {}) as Record<string, unknown>
    const metaAgentId = String(meta.agent_id || "")

    if (agentIdHint && metaAgentId && agentIdHint !== metaAgentId) {
      return NextResponse.json({ error: "Agent mismatch for this payment" }, { status: 403 })
    }

    const clientMeta = getRequestClientMeta(request)
    const capture = await captureStorefrontFromPaystackMetadata({
      reference: verifiedReference,
      metadata: meta,
      actorType: "storefront_customer",
      ipAddress: clientMeta.ipAddress,
      userAgent: clientMeta.userAgent,
    })

    if (!capture.ok && !capture.alreadyRecorded) {
      console.error("[storefront confirm] capture failed:", {
        reference: verifiedReference,
        agentId: metaAgentId,
        orderType: meta.order_type,
        error: capture.error,
      })
      return NextResponse.json(
        {
          success: false,
          error: capture.error || "Failed to record storefront order",
        },
        { status: 500 },
      )
    }


    return NextResponse.json({
      success: true,
      alreadyRecorded: capture.alreadyRecorded,
      orderIds: capture.orderIds,
      insertedCount: capture.insertedCount,
      reference: verifiedReference,
    })
  } catch (error) {
    console.error("[storefront confirm] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
