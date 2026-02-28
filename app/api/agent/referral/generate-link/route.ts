import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agent_id, agent_name } = body

    if (!agent_id?.trim()) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    if (!agent_name?.trim()) {
      return NextResponse.json({ error: "Agent name is required" }, { status: 400 })
    }

    try {
      const { data: existingLink, error: fetchError } = await supabase
        .from("referral_links")
        .select("*")
        .eq("agent_id", agent_id)
        .maybeSingle()

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("[v0] Error fetching existing link:", fetchError)
        return NextResponse.json(
          { error: "Failed to check existing referral link", details: fetchError.message },
          { status: 500 },
        )
      }

      if (existingLink) {
        return NextResponse.json({
          success: true,
          data: existingLink,
          isNew: false,
        })
      }
    } catch (fetchErr) {
      console.error("[v0] Fetch error:", fetchErr)
      return NextResponse.json({ error: "Database query failed" }, { status: 500 })
    }

    const referralCode = `REF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    const referralUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://dataflexghana.com"}/agent/register?ref=${referralCode}`

    const { data: newLink, error } = await supabase
      .from("referral_links")
      .insert([
        {
          agent_id,
          agent_name,
          referral_code: referralCode,
          referral_url: referralUrl,
          status: "active",
          total_clicks: 0,
          total_referrals: 0,
          total_earnings: 0,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating referral link:", error.message, error.code)
      return NextResponse.json(
        {
          error: "Failed to create referral link",
          details: error.message,
        },
        { status: 500 },
      )
    }

    if (!newLink) {
      return NextResponse.json({ error: "Failed to create referral link" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newLink,
      isNew: true,
    })
  } catch (error) {
    console.error("[v0] Error in generate-link route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agent_id")

    if (!agentId?.trim()) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    const { data: link, error } = await supabase
      .from("referral_links")
      .select("*")
      .eq("agent_id", agentId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching referral link:", error)
      return NextResponse.json({ error: "Failed to fetch referral link" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: link || null,
    })
  } catch (error) {
    console.error("[v0] Error in GET route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
