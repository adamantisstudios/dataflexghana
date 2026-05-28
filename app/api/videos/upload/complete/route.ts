export const runtime = "nodejs"
export const maxDuration = 300

import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { deleteFromR2, getR2PublicUrl } from "@/lib/r2-client"
import { requireEnv } from "@/lib/r2-env"
import { formatUploadErrorMessage } from "@/lib/upload-error-messages"

export async function POST(request: NextRequest) {
  let videoObjectKey: string | null = null

  try {
    const authResult = await authenticateAgent(request)
    if (!authResult.success || !authResult.user) {
      return createAuthErrorResponse(authResult.error || "Agent authentication required")
    }
    const agent = authResult.user

    const { data: agentRow } = await supabaseAdmin
      .from("agents")
      .select("can_teach")
      .eq("id", agent.id)
      .single()

    if (!agentRow?.can_teach) {
      return NextResponse.json(
        { success: false, error: "Only approved teachers can upload videos" },
        { status: 403 },
      )
    }

    const body = await request.json()
    const channelId = String(body.channelId || "").trim()
    const objectKey = String(body.objectKey || "").trim()
    const title = String(body.title || "").trim()
    const description = String(body.description || "")
    const duration = Number(body.duration || 0)
    const width = Number(body.width || 0)
    const height = Number(body.height || 0)
    const fileSize = Number(body.fileSize || 0)
    const thumbnailObjectKey = body.thumbnailObjectKey
      ? String(body.thumbnailObjectKey).trim()
      : null

    if (!channelId || !objectKey || !title) {
      return NextResponse.json(
        { success: false, error: "channelId, objectKey, and title are required" },
        { status: 400 },
      )
    }

    if (!objectKey.startsWith(`channel-videos/${channelId}/`)) {
      return NextResponse.json({ success: false, error: "Invalid video object key" }, { status: 400 })
    }

    videoObjectKey = objectKey
    const bucket = requireEnv("R2_BUCKET_NAME")
    const videoUrl = getR2PublicUrl(objectKey, bucket)
    const thumbnailUrl = thumbnailObjectKey
      ? getR2PublicUrl(thumbnailObjectKey, bucket)
      : ""

    const { data: videoData, error: dbError } = await supabaseAdmin
      .from("videos")
      .insert({
        channel_id: channelId,
        created_by: agent.id,
        title,
        description,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration,
        file_size: fileSize,
        width,
        height,
        status: "published",
        is_published: true,
        is_deleted: false,
        view_count: 0,
        comment_count: 0,
        save_count: 0,
        share_count: 0,
      })
      .select()
      .single()

    if (dbError) {
      await deleteFromR2(objectKey, bucket).catch(() => {})
      if (thumbnailObjectKey) await deleteFromR2(thumbnailObjectKey, bucket).catch(() => {})
      return NextResponse.json(
        { success: false, error: `Could not save video record: ${dbError.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      videoId: videoData.id,
      videoUrl,
      thumbnailUrl,
      message: "Video uploaded successfully",
    })
  } catch (err) {
    if (videoObjectKey) {
      await deleteFromR2(videoObjectKey).catch(() => {})
    }
    console.error("[videos/complete]", err)
    return NextResponse.json(
      { success: false, error: formatUploadErrorMessage(err, "Video upload failed") },
      { status: 500 },
    )
  }
}
