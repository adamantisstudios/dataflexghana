import { supabase } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelIds = searchParams.getAll("channelId")

    if (!channelIds || channelIds.length === 0) {
      return NextResponse.json({ error: "No channel IDs provided" }, { status: 400 })
    }

    const { data: memberCounts, error } = await supabase
      .from("channel_members")
      .select("channel_id")
      .in("channel_id", channelIds)

    if (error) {
      console.error("[v0] Error fetching member counts:", error)
      return NextResponse.json({ error: "Failed to fetch member counts" }, { status: 500 })
    }

    // Build count map
    const countMap = new Map()
    memberCounts?.forEach((m) => {
      countMap.set(m.channel_id, (countMap.get(m.channel_id) || 0) + 1)
    })

    // Return counts for all requested channels
    const result = Object.fromEntries(channelIds.map((id) => [id, countMap.get(id) || 0]))

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
