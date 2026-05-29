import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getDatingSettings } from "@/lib/dating/dating-settings"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export const dynamic = "force-dynamic"

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
    const scheduled_at = String(body.scheduled_at ?? "").trim()
    if (!scheduled_at) {
      return NextResponse.json({ error: "scheduled_at is required" }, { status: 400 })
    }

    const { getAdminClient } = await import("@/lib/supabase-base")
    const db = getAdminClient()
    let email = String(body.email ?? "").trim()
    if (!email) {
      const { data: agentRow } = await db.from("agents").select("email").eq("id", agentId).maybeSingle()
      email = String(agentRow?.email ?? "").trim()
    }
    if (!email) {
      return NextResponse.json({ error: "Add your email in Agent Settings first" }, { status: 400 })
    }

    const settings = await getDatingSettings()
    const counsellingPrice = settings.counselling_session_price

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(counsellingPrice * 100),
        currency: "GHS",
        callback_url: `${request.nextUrl.origin}/api/paystack/dating/callback`,
        metadata: {
          agent_id: agentId,
          order_type: "dating_counselling",
          scheduled_at,
          amount_ghs: counsellingPrice,
        },
      }),
    })

    const paystackData = await paystackRes.json()
    if (!paystackRes.ok || !paystackData.status) {
      return NextResponse.json({ error: paystackData.message || "Payment failed" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
    })
  } catch (e) {
    console.error("[dating counselling pay]", e)
    return NextResponse.json({ error: "Failed to start payment" }, { status: 500 })
  }
}
