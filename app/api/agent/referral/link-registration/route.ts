import { type NextRequest, NextResponse } from "next/server"
import { linkReferredAgentRegistration } from "@/lib/referral-agent-program"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { referred_agent_id, referral_code } = body

    if (!referred_agent_id || !referral_code) {
      return NextResponse.json({ error: "referred_agent_id and referral_code are required" }, { status: 400 })
    }

    const result = await linkReferredAgentRegistration(referred_agent_id, referral_code)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: result.message })
  } catch (error) {
    console.error("link-registration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
