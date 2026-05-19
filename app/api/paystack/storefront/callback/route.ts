import { type NextRequest, NextResponse } from "next/server"
import { getRequestClientMeta } from "@/lib/audit-logger"
import { captureStorefrontFromPaystackMetadata } from "@/lib/storefront-order-capture"
import {
  buildStorefrontAdminWhatsAppUrl,
  formatStorefrontAdminWhatsAppMessage,
  metadataValue,
  parseStorefrontItemsFromMetadata,
} from "@/lib/storefront-order-whatsapp"
import { getStorefrontPublicBase } from "@/lib/storefront-utils"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

const STOREFRONT_ORIGIN = (
  process.env.NEXT_PUBLIC_STOREFRONT_ORIGIN || "https://referralpowerhouse.vercel.app"
).replace(/\/$/, "")

export const dynamic = "force-dynamic"

function paymentReferenceFromRequest(request: NextRequest): string | null {
  const params = request.nextUrl.searchParams
  return params.get("reference") || params.get("trxref") || params.get("ref") || null
}

function resolveRedirectSegment(meta: Record<string, unknown>, agentId: string): string {
  const segment = String(
    metadataValue(meta, "store_segment") ||
      metadataValue(meta, "store_slug") ||
      meta.store_segment ||
      meta.store_slug ||
      "",
  ).trim()
  return segment || agentId
}

function buildSuccessRedirect(
  agentId: string,
  reference: string,
  meta: Record<string, unknown>,
  items: ReturnType<typeof parseStorefrontItemsFromMetadata>,
  cartTotal: number,
) {
  const storeName = String(meta.store_name || "Store")
  const segment = resolveRedirectSegment(meta, agentId)

  const whatsappMessage = formatStorefrontAdminWhatsAppMessage({
    storeName,
    items: items.map((item) => ({
      network: item.network,
      bundle_name: item.bundle_name,
      size_gb: item.size_gb,
      customer_phone: item.customer_phone,
      total_paid: item.total_paid,
    })),
    cartTotal,
    reference,
  })

  const redirectUrl = new URL(`${STOREFRONT_ORIGIN}/store/${encodeURIComponent(segment)}`)
  redirectUrl.searchParams.set("payment", "success")
  redirectUrl.searchParams.set("ref", reference)
  redirectUrl.searchParams.set("whatsapp_url", buildStorefrontAdminWhatsAppUrl(whatsappMessage))
  return redirectUrl.toString()
}

function buildFailureRedirect(reference?: string | null) {
  const url = new URL(`${getStorefrontPublicBase()}/payment-failed`)
  if (reference) url.searchParams.set("reference", reference)
  return url.toString()
}

export async function GET(request: NextRequest) {
  const referenceParam = paymentReferenceFromRequest(request)

  if (!referenceParam || !PAYSTACK_SECRET_KEY) {
    return NextResponse.redirect(buildFailureRedirect(referenceParam))
  }

  let verifiedReference = referenceParam
  let meta: Record<string, unknown> = {}
  let amountPaid = 0

  try {
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(referenceParam)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } },
    )
    const verifyData = await verifyRes.json()

    if (!verifyRes.ok || verifyData.data?.status !== "success") {
      console.error("[storefront callback] verification failed:", verifyData)
      return NextResponse.redirect(buildFailureRedirect(referenceParam))
    }

    verifiedReference = String(verifyData.data.reference || referenceParam)
    meta = (verifyData.data.metadata || {}) as Record<string, unknown>
    amountPaid = Number(verifyData.data.amount) / 100
  } catch (error) {
    console.error("[storefront callback] verify error:", error)
    return NextResponse.redirect(buildFailureRedirect(referenceParam))
  }

  const agentId = String(metadataValue(meta, "agent_id") || meta.agent_id || "")
  const orderType = String(metadataValue(meta, "order_type") || meta.order_type || "data_bundle")
  const cartTotal = Number(meta.cart_total ?? amountPaid)
  const segment = resolveRedirectSegment(meta, agentId)

  if (!agentId) {
    console.error("[storefront callback] missing agent in metadata", meta)
    return NextResponse.redirect(buildFailureRedirect(verifiedReference))
  }

  if (orderType === "compliance") {
    const clientMeta = getRequestClientMeta(request)
    const capture = await captureStorefrontFromPaystackMetadata({
      reference: verifiedReference,
      metadata: meta,
      actorType: "system",
      ipAddress: clientMeta.ipAddress,
      userAgent: clientMeta.userAgent,
    })
    if (!capture.ok) {
      console.error("[storefront callback] compliance capture:", capture.error)
    }
    const redirectUrl = new URL(`${STOREFRONT_ORIGIN}/store/${encodeURIComponent(segment)}`)
    redirectUrl.searchParams.set("compliance_paid", verifiedReference)
    redirectUrl.searchParams.set("form_type", String(meta.form_type || "sole_proprietorship"))
    return NextResponse.redirect(redirectUrl.toString())
  }

  const items = parseStorefrontItemsFromMetadata(meta)
  if (orderType === "data_bundle" && items.length === 0) {
    console.error("[storefront callback] missing bundle items", meta)
    return NextResponse.redirect(buildFailureRedirect(verifiedReference))
  }

  const clientMeta = getRequestClientMeta(request)
  const capture = await captureStorefrontFromPaystackMetadata({
    reference: verifiedReference,
    metadata: meta,
    actorType: "system",
    ipAddress: clientMeta.ipAddress,
    userAgent: clientMeta.userAgent,
  })

  if (!capture.ok && !capture.alreadyRecorded) {
    console.error("[storefront callback] capture failed (user still redirected):", capture.error, {
      reference: verifiedReference,
      agentId,
    })
  } else if (capture.insertedCount > 0) {
    console.info("[storefront callback] captured orders:", {
      reference: verifiedReference,
      agentId,
      insertedCount: capture.insertedCount,
    })
  }

  if (orderType === "wholesale") {
    const redirectUrl = new URL(`${STOREFRONT_ORIGIN}/store/${encodeURIComponent(segment)}`)
    redirectUrl.searchParams.set("payment", "success")
    redirectUrl.searchParams.set("ref", verifiedReference)
    redirectUrl.searchParams.set("order_type", "wholesale")
    return NextResponse.redirect(redirectUrl.toString())
  }

  return NextResponse.redirect(
    buildSuccessRedirect(agentId, verifiedReference, meta, items, cartTotal),
  )
}
