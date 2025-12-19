import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agent_id")

    if (!agentId?.trim()) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    const { data: referralLink, error: linkError } = await supabase
      .from("referral_links")
      .select("*")
      .eq("agent_id", agentId)
      .maybeSingle()

    if (linkError && linkError.code !== "PGRST116") {
      console.error("[v0] Error fetching referral link:", linkError)
      return NextResponse.json({ error: "Failed to fetch referral link" }, { status: 500 })
    }

    const { data: credits, error: creditsError } = await supabase
      .from("referral_credits")
      .select("*")
      .eq("referring_agent_id", agentId)
      .order("created_at", { ascending: false })

    if (creditsError) {
      console.error("[v0] Error fetching referral credits:", creditsError)
    }

    const { data: trackingData, error: trackingError } = await supabase
      .from("referral_tracking")
      .select("*")
      .eq("referral_link_id", referralLink?.id)

    if (trackingError) {
      console.error("[v0] Error fetching tracking data:", trackingError)
    }

    const stats = {
      totalClicks: referralLink?.total_clicks || 0,
      totalReferrals: credits?.length || 0,
      confirmedReferrals:
        credits?.filter((c) => c.status === "confirmed" || c.status === "credited" || c.status === "paid_out").length ||
        0,
      completedReferrals: credits?.filter((c) => c.status === "credited" || c.status === "paid_out").length || 0,
      totalEarnings: credits?.reduce((sum: number, c: any) => sum + (c.credit_amount || 7), 0) || 0,
      conversionRate:
        credits && credits.length > 0
          ? (
              (credits.filter((c) => c.status === "credited" || c.status === "paid_out").length / credits.length) *
              100
            ).toFixed(1)
          : "0",
    }

    console.log("[v0] Referral stats calculated:", {
      agentId,
      totalClicks: stats.totalClicks,
      totalReferrals: stats.totalReferrals,
      completedReferrals: stats.completedReferrals,
      totalEarnings: stats.totalEarnings,
    })

    const recentReferrals = []
    for (const credit of (credits || []).slice(0, 10)) {
      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .select("id, full_name, phone_number")
        .eq("id", credit.referred_agent_id)
        .maybeSingle()

      if (!agentError && agent) {
        recentReferrals.push({
          id: credit.id,
          full_name: agent.full_name,
          phone_number: agent.phone_number,
          status: credit.status,
          credit_amount: credit.credit_amount,
          credited_at: credit.created_at,
        })
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      recentReferrals,
      data: referralLink || null,
    })
  } catch (error) {
    console.error("[v0] Error in stats route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
