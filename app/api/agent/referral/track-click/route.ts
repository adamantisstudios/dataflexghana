import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { referral_code } = body

    if (!referral_code?.trim()) {
      return NextResponse.json({ error: "Referral code is required" }, { status: 400 })
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    const db = getAdminClient()

    const { data: link, error: linkError } = await db
      .from("referral_links")
      .select("*")
      .eq("referral_code", referral_code)
      .maybeSingle()

    if (linkError || !link) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 })
    }

    const { data: tracking, error: trackError } = await db
      .from("referral_tracking")
      .insert({
        referral_link_id: link.id,
        referral_code,
        clicked_at: new Date().toISOString(),
        visitor_ip: ip,
        visitor_agent: userAgent,
        converted: false,
        admin_approval_status: "pending",
      })
      .select()
      .single()

    if (trackError) {
      return NextResponse.json({ error: "Failed to track referral" }, { status: 500 })
    }

    await db
      .from("referral_links")
      .update({ total_clicks: (link.total_clicks || 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", link.id)

    return NextResponse.json({ success: true, data: tracking })
  } catch (error) {
    console.error("Error in track-click route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
