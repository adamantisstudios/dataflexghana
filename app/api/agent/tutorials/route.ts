import { NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { buildLegacyVimeoEmbed, sanitizeTutorialEmbed } from "@/lib/tutorial-embed"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const db = getAdminClient()

    const { data, error } = await db
      .from("tutorial_videos")
      .select("id, title, platform, embed_code, vimeo_video_id")
      .eq("is_active", true)
      .order("order_index", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const videos = (data || [])
      .map((row) => {
        let embed_code = row.embed_code ? sanitizeTutorialEmbed(row.embed_code) : ""
        if (!embed_code && row.vimeo_video_id) {
          embed_code = sanitizeTutorialEmbed(buildLegacyVimeoEmbed(row.vimeo_video_id))
        }
        if (!embed_code) return null

        return {
          id: row.id,
          title: row.title,
          platform: row.platform || "vimeo",
          embed_code,
        }
      })
      .filter(Boolean)

    return NextResponse.json({ videos })
  } catch (error) {
    console.error("GET agent tutorials:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
