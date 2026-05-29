import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { applyDatingPlanPurchase } from "@/lib/dating/dating-server"
import type { DatingPlan } from "@/lib/dating/constants"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const reference =
    request.nextUrl.searchParams.get("reference") ||
    request.nextUrl.searchParams.get("trxref") ||
    null

  const failUrl = new URL("/agent/dating", request.nextUrl.origin)
  failUrl.searchParams.set("payment", "failed")

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
    const orderType = String(meta.order_type || "")
    const verifiedRef = String(verifyData.data.reference || reference)

    if (!agentId) return NextResponse.redirect(failUrl.toString())

    const db = getAdminClient()

    if (orderType === "dating_counselling") {
      const scheduled_at = String(meta.scheduled_at || "")
      if (scheduled_at) {
        await db.from("dating_counselling_sessions").insert({
          agent_id: agentId,
          counsellor_name: "DataFlex Counsellor",
          scheduled_at,
          duration_minutes: 30,
          status: "confirmed",
          is_free: false,
          session_type: "paid",
        })
      }
    } else if (orderType === "dating_subscription") {
      const plan = String(meta.dating_plan || "silver") as DatingPlan | "coins"
      const { data: existing } = await db
        .from("dating_subscriptions")
        .select("paystack_reference")
        .eq("agent_id", agentId)
        .maybeSingle()

      if (existing?.paystack_reference !== verifiedRef) {
        await applyDatingPlanPurchase(agentId, plan, verifiedRef)
      }
    }

    const successUrl = new URL("/agent/dating", request.nextUrl.origin)
    successUrl.searchParams.set("payment", "success")
    return NextResponse.redirect(successUrl.toString())
  } catch (e) {
    console.error("[dating callback]", e)
    return NextResponse.redirect(failUrl.toString())
  }
}
