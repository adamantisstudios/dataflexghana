import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
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

    const { channelId, maxStorageBytes = 536870912, retentionDays = 90 } = await request.json()

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID required" }, { status: 400 })
    }

    // Initialize storage quota
    const { data, error } = await supabase.from("storage_quotas").upsert(
      {
        user_id: user.id,
        channel_id: channelId,
        max_storage_bytes: maxStorageBytes,
        retention_days: retentionDays,
        auto_cleanup_enabled: true,
      },
      {
        onConflict: "user_id,channel_id",
      },
    )

    if (error) {
      console.error("[v0] Error initializing quota:", error)
      return NextResponse.json({ error: "Failed to initialize storage quota" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Storage quota initialized",
      maxStorageBytes,
      retentionDays,
    })
  } catch (error) {
    console.error("[v0] Initialize storage error:", error)
    return NextResponse.json({ error: "Failed to initialize storage" }, { status: 500 })
  }
}
