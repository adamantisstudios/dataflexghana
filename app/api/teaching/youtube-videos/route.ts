export const dynamic = "force-dynamic"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export const revalidate = 60 // Revalidate every 60 seconds

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
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      },
    )

    const channelId = request.nextUrl.searchParams.get("channelId")

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 })
    }

    const { data: youtubeVideos, error } = await supabase
      .from("youtube_videos")
      .select("*")
      .eq("channel_id", channelId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching YouTube videos:", error)
      return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 })
    }

    const response = NextResponse.json({ data: youtubeVideos })
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120")
    return response
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
