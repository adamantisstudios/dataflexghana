import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { COINS_PACK, DATING_PLANS } from "@/lib/dating/constants"
import { getDatingSettings, getPlanPriceGhs } from "@/lib/dating/dating-settings"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export const dynamic = "force-dynamic"

function getCallbackUrl(request: NextRequest): string {
  return `${request.nextUrl.origin}/api/paystack/dating/callback`
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Paystack not configured" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const plan = String(body.plan ?? "").trim() as "silver" | "gold" | "coins"
    const terms_accepted = Boolean(body.terms_accepted)

    if (!terms_accepted) {
      return NextResponse.json({ error: "Accept Dating Terms before purchase" }, { status: 400 })
    }

    const settings = await getDatingSettings()
    let amountGhs = 0
    if (plan === "coins") {
      amountGhs = settings.coin_pack_price
    } else if (plan === "silver" || plan === "gold") {
      amountGhs = getPlanPriceGhs(plan, settings)
    } else {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    if (amountGhs <= 0) {
      return NextResponse.json({ error: "Invalid plan amount" }, { status: 400 })
    }

    const db = getAdminClient()
    let email = String(body.email ?? "").trim()
    if (!email) {
      const { data: agentRow } = await db.from("agents").select("email").eq("id", agentId).maybeSingle()
      email = String(agentRow?.email ?? "").trim()
    }
    if (!email) {
      return NextResponse.json({ error: "Add your email in Agent Settings first" }, { status: 400 })
    }

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amountGhs * 100),
        currency: "GHS",
        callback_url: getCallbackUrl(request),
        metadata: {
          agent_id: agentId,
          order_type: "dating_subscription",
          dating_plan: plan,
          amount_ghs: amountGhs,
        },
      }),
    })

    const paystackData = await paystackRes.json()
    if (!paystackRes.ok || !paystackData.status) {
      return NextResponse.json(
        { error: paystackData.message || "Paystack initialization failed" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    })
  } catch (e) {
    console.error("[dating paystack initialize]", e)
    return NextResponse.json({ error: "Failed to start payment" }, { status: 500 })
  }
}
