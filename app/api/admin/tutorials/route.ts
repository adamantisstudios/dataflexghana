import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { authenticateAdmin } from "@/lib/api-auth"
import { detectPlatformFromEmbed, sanitizeTutorialEmbed } from "@/lib/tutorial-embed"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const db = getAdminClient()
  const { data, error } = await db
    .from("tutorial_videos")
    .select("*")
    .order("order_index", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, embed_code, order_index, platform, is_active } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    const sanitized = sanitizeTutorialEmbed(embed_code || "")
    if (!sanitized) {
      return NextResponse.json(
        { error: "A valid Vimeo or YouTube iframe embed code is required" },
        { status: 400 },
      )
    }

    const detectedPlatform = detectPlatformFromEmbed(sanitized)
    const resolvedPlatform =
      platform === "youtube" || platform === "vimeo" ? platform : detectedPlatform || "vimeo"

    if (detectedPlatform && detectedPlatform !== resolvedPlatform) {
      return NextResponse.json(
        { error: `Embed source does not match selected platform (${resolvedPlatform})` },
        { status: 400 },
      )
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("tutorial_videos")
      .insert({
        title: title.trim(),
        embed_code: sanitized,
        platform: resolvedPlatform,
        order_index: Number.isFinite(Number(order_index)) ? Number(order_index) : 0,
        is_active: is_active !== false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, title, embed_code, order_index, platform, is_active } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}

    if (title !== undefined) {
      if (!title?.trim()) {
        return NextResponse.json({ error: "title cannot be empty" }, { status: 400 })
      }
      updates.title = title.trim()
    }

    if (embed_code !== undefined) {
      const sanitized = sanitizeTutorialEmbed(embed_code)
      if (!sanitized) {
        return NextResponse.json(
          { error: "A valid Vimeo or YouTube iframe embed code is required" },
          { status: 400 },
        )
      }
      updates.embed_code = sanitized

      const detectedPlatform = detectPlatformFromEmbed(sanitized)
      if (platform === "youtube" || platform === "vimeo") {
        if (detectedPlatform && detectedPlatform !== platform) {
          return NextResponse.json(
            { error: `Embed source does not match selected platform (${platform})` },
            { status: 400 },
          )
        }
        updates.platform = platform
      } else if (detectedPlatform) {
        updates.platform = detectedPlatform
      }
    } else if (platform === "youtube" || platform === "vimeo") {
      updates.platform = platform
    }

    if (order_index !== undefined) {
      updates.order_index = Number.isFinite(Number(order_index)) ? Number(order_index) : 0
    }

    if (is_active !== undefined) {
      updates.is_active = Boolean(is_active)
    }

    const db = getAdminClient()
    const { data, error } = await db.from("tutorial_videos").update(updates).eq("id", id).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const db = getAdminClient()
  const { error } = await db.from("tutorial_videos").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
