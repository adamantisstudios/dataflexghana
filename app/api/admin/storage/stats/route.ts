import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get("channelId")

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID required" }, { status: 400 })
    }

    // Get storage stats
    const { data: stats, error } = await supabase.rpc("check_storage_quota", {
      p_user_id: user.id,
      p_channel_id: channelId,
    })

    if (error) {
      console.error("[v0] Error fetching storage stats:", error)
      return NextResponse.json({ error: "Failed to fetch storage stats" }, { status: 500 })
    }

    // Get audio count
    const { count: audioCount } = await supabase
      .from("audio_files_metadata")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("channel_id", channelId)

    // Get retention days
    const { data: quotaData } = await supabase
      .from("storage_quotas")
      .select("retention_days")
      .eq("user_id", user.id)
      .eq("channel_id", channelId)
      .single()

    return NextResponse.json({
      currentUsageBytes: stats?.[0]?.current_usage_bytes || 0,
      maxQuotaBytes: stats?.[0]?.max_quota_bytes || 536870912,
      isOverQuota: stats?.[0]?.is_over_quota || false,
      percentageUsed: stats?.[0]?.percentage_used || 0,
      audioCount: audioCount || 0,
      retentionDays: quotaData?.retention_days || 90,
    })
  } catch (error) {
    console.error("[v0] Storage stats error:", error)
    return NextResponse.json({ error: "Failed to get storage stats" }, { status: 500 })
  }
}
