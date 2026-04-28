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

    // Check if user is admin (you may want to add an admin role check)
    // For now, we'll allow any authenticated user to view this

    // Get storage summary from view
    const { data: summaries, error } = await supabase.from("audio_storage_summary").select("*")

    if (error) {
      console.error("[v0] Error fetching storage summary:", error)
      return NextResponse.json({ error: "Failed to fetch storage summary" }, { status: 500 })
    }

    return NextResponse.json(
      summaries.map((s: any) => ({
        userId: s.user_id,
        email: s.email,
        totalStorageBytes: s.total_storage_bytes || 0,
        totalAudioCount: s.total_audio_count || 0,
        maxStorageBytes: s.max_storage_bytes || 536870912,
        storagePercentage: s.storage_percentage || 0,
        retentionDays: s.retention_days || 90,
        autoCleanupEnabled: s.auto_cleanup_enabled || true,
      })),
    )
  } catch (error) {
    console.error("[v0] Storage summary error:", error)
    return NextResponse.json({ error: "Failed to get storage summary" }, { status: 500 })
  }
}
