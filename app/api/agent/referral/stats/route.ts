import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agent_id")

    if (!agentId?.trim()) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    const db = getAdminClient()

    const { data: referralLink, error: linkError } = await db
      .from("referral_links")
      .select("*")
      .eq("agent_id", agentId)
      .maybeSingle()

    if (linkError && linkError.code !== "PGRST116") {
      return NextResponse.json({ error: "Failed to fetch referral link" }, { status: 500 })
    }

    const { data: credits } = await db
      .from("referral_credits")
      .select("*")
      .eq("referring_agent_id", agentId)
      .order("created_at", { ascending: false })

    const { data: trackingData } = referralLink?.id
      ? await db.from("referral_tracking").select("*").eq("referral_link_id", referralLink.id)
      : { data: [] }

    const totalReferrals = credits?.length || 0
    const pendingCredits = credits?.filter((c) => c.status === "pending" || c.status === "confirmed").length || 0
    const creditedAmount =
      credits
        ?.filter((c) => c.status === "credited" || c.status === "paid_out")
        .reduce((sum, c) => sum + Number(c.credit_amount || 0), 0) || 0

    return NextResponse.json({
      success: true,
      data: {
        referralLink,
        credits: credits || [],
        tracking: trackingData || [],
        stats: {
          totalClicks: referralLink?.total_clicks || 0,
          totalReferrals,
          pendingCredits,
          totalEarnings: creditedAmount,
        },
      },
    })
  } catch (error) {
    console.error("Error in referral stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
