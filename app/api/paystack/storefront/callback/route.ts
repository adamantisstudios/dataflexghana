import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { creditStorefrontCommission } from "@/lib/storefront-server"
import {
  buildStorefrontAdminWhatsAppUrl,
  formatStorefrontAdminWhatsAppMessage,
  parseStorefrontItemsFromMetadata,
} from "@/lib/storefront-order-whatsapp"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  if (!reference || !PAYSTACK_SECRET_KEY) {
    return NextResponse.redirect(`${appUrl}/store/payment-failed`)
  }

  try {
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    })
    const verifyData = await verifyRes.json()

    if (!verifyRes.ok || verifyData.data?.status !== "success") {
      return NextResponse.redirect(`${appUrl}/store/payment-failed?reference=${reference}`)
    }

    const meta = (verifyData.data.metadata || {}) as Record<string, unknown>
    const agentId = String(meta.agent_id || "")
    const items = parseStorefrontItemsFromMetadata(meta)
    const cartTotal = Number(meta.cart_total ?? verifyData.data.amount / 100)
    const storeName = String(meta.store_name || "Store")

    if (!agentId || items.length === 0) {
      console.error("storefront callback: missing agent or items", meta)
      return NextResponse.redirect(`${appUrl}/store/payment-failed?reference=${reference}`)
    }

    const db = getAdminClient()

    const { data: existing } = await db
      .from("storefront_orders")
      .select("id")
      .eq("paystack_reference", reference)
      .limit(1)

    if (!existing?.length) {
      const rows = items.map((item) => ({
        agent_id: agentId,
        data_bundle_id: item.data_bundle_id,
        customer_phone: item.customer_phone,
        paystack_reference: reference,
        base_cost: item.base_cost,
        agent_markup: item.agent_markup,
        total_paid: item.total_paid,
        status: "Pending",
      }))

      const { error: insertError } = await db.from("storefront_orders").insert(rows)

      if (insertError) {
        console.error("storefront order insert:", insertError)
      } else {
        const totalMarkup = items.reduce((sum, item) => sum + item.agent_markup, 0)
        if (totalMarkup > 0) {
          await creditStorefrontCommission(agentId, totalMarkup)
        }
      }
    }

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

    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    console.error("storefront callback:", error)
    return NextResponse.redirect(`${appUrl}/store/payment-failed?reference=${reference}`)
  }
}
