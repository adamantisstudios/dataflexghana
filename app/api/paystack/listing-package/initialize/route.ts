import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { getActiveListingPackages } from "@/lib/listing-packages-server"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export const dynamic = "force-dynamic"

function getListingCallbackUrl(request: NextRequest): string {
  const origin = request.nextUrl.origin
  return `${origin}/api/paystack/listing-package/callback`
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) {
    return createAuthErrorResponse(auth.error || "Agent authentication required")
  }

  const agentId = getAuthAgentId(auth)
  if (!agentId) {
    return NextResponse.json({ error: "Agent authentication required" }, { status: 401 })
  }

  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 500 })
    }

    const body = await request.json()
    const package_id = String(body.package_id ?? "").trim()
    const terms_accepted = Boolean(body.terms_accepted)

    if (!terms_accepted) {
      return NextResponse.json({ error: "You must accept the Listing Terms" }, { status: 400 })
    }
    if (!package_id) {
      return NextResponse.json({ error: "package_id is required" }, { status: 400 })
    }

    const packages = await getActiveListingPackages()
    const pkg = packages.find((p) => p.id === package_id)
    if (!pkg) {
      return NextResponse.json({ error: "Package not found or inactive" }, { status: 404 })
    }

    const db = getAdminClient()
    let email = String(body.email ?? "").trim()
    if (!email) {
      const { data: agentRow } = await db.from("agents").select("email").eq("id", agentId).maybeSingle()
      email = String(agentRow?.email ?? "").trim()
    }
    if (!email) {
      return NextResponse.json(
        { error: "Add your email in Agent Settings before purchasing a listing package" },
        { status: 400 },
      )
    }

    const amountKobo = Math.round(pkg.price * 100)
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        currency: "GHS",
        callback_url: getListingCallbackUrl(request),
        metadata: {
          agent_id: agentId,
          order_type: "listing_package",
          package_id: pkg.id,
          package_name: pkg.name,
          amount_ghs: pkg.price,
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
    console.error("[listing-package initialize]", e)
    return NextResponse.json({ error: "Failed to start payment" }, { status: 500 })
  }
}
