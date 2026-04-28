import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  try {
    const { agent_id } = await request.json()

    if (!agent_id) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    // Get the referral link for this agent
    const { data: referralLink } = await supabase
      .from("referral_links")
      .select("id")
      .eq("agent_id", agent_id)
      .maybeSingle()

    if (!referralLink) {
      return NextResponse.json({ error: "No referral link found for this agent" }, { status: 404 })
    }

    // Recalculate total clicks
    const { data: clicks } = await supabase
      .from("referral_tracking")
      .select("id", { count: "exact" })
      .eq("referral_link_id", referralLink.id)

    // Recalculate total referrals (converted)
    const { data: conversions } = await supabase
      .from("referral_tracking")
      .select("id", { count: "exact" })
      .eq("referral_link_id", referralLink.id)
      .eq("referred_user_registered", true)

    // Recalculate total earnings
    const { data: earnings } = await supabase
      .from("referral_credits")
      .select("credit_amount")
      .eq("referring_agent_id", agent_id)
      .in("status", ["credited", "paid_out"])

    const totalEarnings = earnings?.reduce((sum, e) => sum + (e.credit_amount || 0), 0) || 0

    // Update referral_links with recalculated values
    const { error: updateError } = await supabase
      .from("referral_links")
      .update({
        total_clicks: clicks?.count || 0,
        total_referrals: conversions?.count || 0,
        total_earnings: totalEarnings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", referralLink.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: "Referral stats synced successfully",
      data: {
        total_clicks: clicks?.count || 0,
        total_referrals: conversions?.count || 0,
        total_earnings: totalEarnings,
      },
    })
  } catch (error) {
    console.error("[v0] Error syncing referral stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync referral stats",
      },
      { status: 500 },
    )
  }
}
