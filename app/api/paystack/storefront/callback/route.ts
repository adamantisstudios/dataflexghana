import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { creditStorefrontCommission } from "@/lib/storefront-server"

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

    const meta = verifyData.data.metadata || {}
    const agentId = meta.agent_id
    const dataBundleId = meta.data_bundle_id
    const customerPhone = meta.customer_phone
    const baseCost = Number(meta.base_cost ?? 0)
    const agentMarkup = Number(meta.agent_markup ?? 0)
    const totalPaid = Number(meta.total_paid ?? verifyData.data.amount / 100)

    const db = getAdminClient()

    const { data: existing } = await db
      .from("storefront_orders")
      .select("id")
      .eq("paystack_reference", reference)
      .maybeSingle()

    if (!existing) {
      const { error: insertError } = await db.from("storefront_orders").insert({
        agent_id: agentId,
        data_bundle_id: dataBundleId,
        customer_phone: customerPhone,
        paystack_reference: reference,
        base_cost: baseCost,
        agent_markup: agentMarkup,
        total_paid: totalPaid,
        status: "Pending",
      })

      if (insertError) {
        console.error("storefront order insert:", insertError)
      } else if (agentMarkup > 0) {
        await creditStorefrontCommission(agentId, agentMarkup)
      }
    }

    return NextResponse.redirect(
      `${appUrl}/public-agent-sandbox/${agentId}?payment=success&ref=${reference}`,
    )
  } catch (error) {
    console.error("storefront callback:", error)
    return NextResponse.redirect(`${appUrl}/store/payment-failed?reference=${reference}`)
  }
}
