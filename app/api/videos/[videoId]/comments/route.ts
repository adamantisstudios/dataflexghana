import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { videoId: string } }) {
  try {
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

    const { data: comments, error } = await supabase
      .from("video_comments")
      .select("*")
      .eq("video_id", params.videoId)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    const response = NextResponse.json({ comments: comments || [] })
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120")

    return response
  } catch (error) {
    console.error("[v0] Comments fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { videoId: string } }) {
  try {
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: comment, error } = await supabase
      .from("video_comments")
      .insert({
        video_id: params.videoId,
        user_id: user.id,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error("[v0] Comment creation error:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
