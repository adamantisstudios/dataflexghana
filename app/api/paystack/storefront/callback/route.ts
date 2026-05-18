import { type NextRequest, NextResponse } from "next/server"
import { getRequestClientMeta } from "@/lib/audit-logger"
import {
  captureStorefrontFromPaystackMetadata,
} from "@/lib/storefront-order-capture"
import {
  buildStorefrontAdminWhatsAppUrl,
  formatStorefrontAdminWhatsAppMessage,
  parseStorefrontItemsFromMetadata,
} from "@/lib/storefront-order-whatsapp"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export const dynamic = "force-dynamic"

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
}

function buildSuccessRedirect(
  appUrl: string,
  agentId: string,
  reference: string,
  meta: Record<string, unknown>,
  items: ReturnType<typeof parseStorefrontItemsFromMetadata>,
  cartTotal: number,
) {
  const storeName = String(meta.store_name || "Store")
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

  const redirectUrl = new URL(`${appUrl}/public-agent-sandbox/${agentId}`)
  redirectUrl.searchParams.set("payment", "success")
  redirectUrl.searchParams.set("ref", reference)
  redirectUrl.searchParams.set("whatsapp_url", buildStorefrontAdminWhatsAppUrl(whatsappMessage))
  return redirectUrl.toString()
}

export async function GET(request: NextRequest) {
  const referenceParam = request.nextUrl.searchParams.get("reference")
  const appUrl = appBaseUrl()

  if (!referenceParam || !PAYSTACK_SECRET_KEY) {
    return NextResponse.redirect(`${appUrl}/store/payment-failed`)
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
      return NextResponse.redirect(`${appUrl}/store/payment-failed?reference=${referenceParam}`)
    }

    verifiedReference = String(verifyData.data.reference || referenceParam)
    meta = (verifyData.data.metadata || {}) as Record<string, unknown>
    amountPaid = Number(verifyData.data.amount) / 100
  } catch (error) {
    console.error("[storefront callback] verify error:", error)
    return NextResponse.redirect(`${appUrl}/store/payment-failed?reference=${referenceParam}`)
  }

  const agentId = String(meta.agent_id || "")
  const items = parseStorefrontItemsFromMetadata(meta)
  const cartTotal = Number(meta.cart_total ?? amountPaid)

  if (!agentId || items.length === 0) {
    console.error("[storefront callback] missing agent or items in metadata", meta)
    return NextResponse.redirect(`${appUrl}/store/payment-failed?reference=${verifiedReference}`)
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
  }

  return NextResponse.redirect(
    buildSuccessRedirect(appUrl, agentId, verifiedReference, meta, items, cartTotal),
  )
}
