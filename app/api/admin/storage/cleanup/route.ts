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

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get("channelId")

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID required" }, { status: 400 })
    }

    // Run cleanup function
    const { data: cleanupResult, error } = await supabase.rpc("cleanup_old_audio_files")

    if (error) {
      console.error("[v0] Cleanup error:", error)
      return NextResponse.json({ error: "Failed to cleanup files" }, { status: 500 })
    }

    return NextResponse.json({
      deletedCount: cleanupResult?.[0]?.deleted_count || 0,
      freedBytes: cleanupResult?.[0]?.freed_bytes || 0,
      message: `Cleaned up ${cleanupResult?.[0]?.deleted_count || 0} files, freed ${formatBytes(cleanupResult?.[0]?.freed_bytes || 0)}`,
    })
  } catch (error) {
    console.error("[v0] Cleanup error:", error)
    return NextResponse.json({ error: "Failed to cleanup storage" }, { status: 500 })
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}
