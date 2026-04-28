import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get("channelId")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    const { data: videos, error } = await supabase
      .from("videos")
      .select("*")
      .eq("channel_id", channelId)
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("[v0] Feed fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 })
    }

    const response = NextResponse.json({
      videos: videos || [],
      total: videos?.length || 0,
    })

    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")

    return response
  } catch (error) {
    console.error("[v0] Feed route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
