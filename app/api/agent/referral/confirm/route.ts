import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tracking_id, referred_agent_id } = body

    if (!tracking_id?.trim()) {
      return NextResponse.json({ error: "Tracking ID is required" }, { status: 400 })
    }

    const { data: trackingRecord, error: getError } = await supabase
      .from("referral_tracking")
      .select("referral_link_id, referred_agent_id")
      .eq("id", tracking_id)
      .single()

    if (getError || !trackingRecord) {
      console.error("[v0] Tracking not found:", getError)
      return NextResponse.json({ error: "Tracking record not found" }, { status: 404 })
    }

    // Update tracking to confirmed
    const { data: updated, error: updateError } = await supabase
      .from("referral_tracking")
      .update({
        status: "confirmed",
        referred_agent_id: referred_agent_id || trackingRecord.referred_agent_id,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", tracking_id)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error confirming referral:", updateError)
      return NextResponse.json({ error: "Failed to confirm referral" }, { status: 500 })
    }

    if (trackingRecord.referral_link_id) {
      const { data: link, error: linkError } = await supabase
        .from("referral_links")
        .select("total_referrals")
        .eq("id", trackingRecord.referral_link_id)
        .single()

      if (!linkError && link) {
        await supabase
          .from("referral_links")
          .update({ total_referrals: (link.total_referrals || 0) + 1 })
          .eq("id", trackingRecord.referral_link_id)
      }
    }

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error("[v0] Error in confirm route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
