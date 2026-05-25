import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { createPendingListingSubscription } from "@/lib/listing-packages-server"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const reference =
    request.nextUrl.searchParams.get("reference") ||
    request.nextUrl.searchParams.get("trxref") ||
    null

  const failUrl = new URL("/agent/referralhub", request.nextUrl.origin)
  failUrl.searchParams.set("hubTab", "listings")
  failUrl.searchParams.set("listing_payment", "failed")

  if (!reference || !PAYSTACK_SECRET_KEY) {
    return NextResponse.redirect(failUrl.toString())
  }

  try {
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } },
    )
    const verifyData = await verifyRes.json()

    if (!verifyRes.ok || verifyData.data?.status !== "success") {
      return NextResponse.redirect(failUrl.toString())
    }

    const meta = (verifyData.data.metadata || {}) as Record<string, unknown>
    const agentId = String(meta.agent_id || "")
    const packageId = String(meta.package_id || "")
    const verifiedRef = String(verifyData.data.reference || reference)

    if (!agentId || !packageId) {
      return NextResponse.redirect(failUrl.toString())
    }

    const db = getAdminClient()
    const { data: existing } = await db
      .from("agent_listing_subscriptions")
      .select("id")
      .eq("paystack_reference", verifiedRef)
      .maybeSingle()

    if (!existing) {
      await createPendingListingSubscription({
        agent_id: agentId,
        package_id: packageId,
        paystack_reference: verifiedRef,
      })
    }

    const successUrl = new URL("/agent/referralhub", request.nextUrl.origin)
    successUrl.searchParams.set("hubTab", "listings")
    successUrl.searchParams.set("listing_payment", "pending")
    successUrl.searchParams.set("ref", verifiedRef)
    return NextResponse.redirect(successUrl.toString())
  } catch (e) {
    console.error("[listing-package callback]", e)
    return NextResponse.redirect(failUrl.toString())
  }
}
