import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { referral_code } = body

    if (!referral_code?.trim()) {
      return NextResponse.json({ error: "Referral code is required" }, { status: 400 })
    }

    // Get client IP and user agent
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    const { data: link, error: linkError } = await supabase
      .from("referral_links")
      .select("*")
      .eq("referral_code", referral_code)
      .maybeSingle()

    if (linkError || !link) {
      console.error("[v0] Invalid referral code:", referral_code)
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 })
    }

    const { data: tracking, error: trackError } = await supabase
      .from("referral_tracking")
      .insert([
        {
          referral_link_id: link.id,
          referral_code,
          clicked_at: new Date().toISOString(),
          visitor_ip: ip,
          visitor_agent: userAgent,
          converted: false,
          admin_approval_status: "pending",
        },
      ])
      .select()
      .single()

    if (trackError) {
      console.error("[v0] Error tracking click:", trackError)
      return NextResponse.json({ error: "Failed to track referral" }, { status: 500 })
    }

    // Update referral link click count
    await supabase
      .from("referral_links")
      .update({ total_clicks: (link.total_clicks || 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", link.id)

    return NextResponse.json({
      success: true,
      data: tracking,
    })
  } catch (error) {
    console.error("[v0] Error in track-click route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
