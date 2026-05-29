export const runtime = "nodejs"
export const maxDuration = 300

import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { deleteFromR2, uploadBufferToR2 } from "@/lib/r2-client"
import { formatUploadErrorMessage } from "@/lib/upload-error-messages"
import { canManageChannelContent } from "@/lib/channel-content-permission"

const MAX_SIZE_MB = 100

async function readFileBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

function getInputExtension(file: File): string {
  if (file.name?.match(/\.mp4$/i) || file.type.includes("mp4")) return "mp4"
  if (file.name?.match(/\.mov$/i) || file.type.includes("quicktime")) return "mov"
  if (file.name?.match(/\.webm$/i) || file.type.includes("webm")) return "webm"
  return "mp4"
}

export async function POST(request: NextRequest) {
  let videoObjectKey: string | null = null

  try {
    const authResult = await authenticateAgent(request)
    if (!authResult.success || !authResult.user) {
      return createAuthErrorResponse(authResult.error || "Agent authentication required")
    }
    const agent = authResult.user

    const formData = await request.formData()
    const file = formData.get("file") as File
    const channelId = String(formData.get("channelId") || "").trim()

    const contentAccess = await canManageChannelContent(supabaseAdmin, channelId, agent)
    if (!contentAccess.allowed) {
      return NextResponse.json({ success: false, error: contentAccess.error }, { status: 403 })
    }

    const isMobileRequest = /mobile|android|iphone|ipad/i.test(request.headers.get("user-agent") || "")
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const duration = Number(formData.get("duration") || 0)
    const width = Number(formData.get("width") || 0)
    const height = Number(formData.get("height") || 0)
    const thumbnailFile = formData.get("thumbnail") as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: "Video file is required" }, { status: 400 })
    }

    if (!channelId || !title?.trim()) {
      return NextResponse.json({ success: false, error: "Channel ID and title are required" }, { status: 400 })
    }

    const isValidVideoType =
      file.type.startsWith("video/") ||
      file.type === "application/octet-stream" ||
      (isMobileRequest && file.name && /\.(mp4|webm|mov|avi|mkv)$/i.test(file.name))

    if (!isValidVideoType) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type: ${file.type || "unknown"}. Must be a video.` },
        { status: 400 },
      )
    }

    const rawBuffer = await readFileBuffer(file)
    const sizeMB = rawBuffer.byteLength / 1024 / 1024

    if (sizeMB > MAX_SIZE_MB) {
      return NextResponse.json(
        {
          success: false,
          error: `Video is ${sizeMB.toFixed(1)}MB. Maximum allowed size is ${MAX_SIZE_MB}MB. Try lower quality or use direct upload.`,
        },
        { status: 400 },
      )
    }

    if (duration > 120) {
      return NextResponse.json(
        {
          success: false,
          error: `Video duration exceeds 2 minutes (${(duration / 60).toFixed(1)} minutes). Maximum 120 seconds allowed.`,
        },
        { status: 400 },
      )
    }

    const inputExt = getInputExtension(file)
    const token = `${channelId}/${Date.now()}-${Math.random().toString(36).substring(7)}`
    videoObjectKey = `channel-videos/${token}.${inputExt}`

    const videoUrl = await uploadBufferToR2(
      rawBuffer,
      videoObjectKey,
      file.type || "video/mp4",
    )

    let thumbnailUrl = ""
    try {
      if (thumbnailFile) {
        const thumbKey = `channel-videos/thumbnails/${channelId}-${Date.now()}.jpg`
        const thumbnailBuffer = await readFileBuffer(thumbnailFile)
        thumbnailUrl = await uploadBufferToR2(thumbnailBuffer, thumbKey, "image/jpeg")
      }
    } catch (thumbErr) {
      console.warn("[channel-video] Thumbnail upload skipped:", thumbErr)
    }

    const { data: videoData, error: dbError } = await supabaseAdmin
      .from("videos")
      .insert({
        channel_id: channelId,
        created_by: agent.id,
        title: title.trim(),
        description: description || "",
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration,
        file_size: rawBuffer.byteLength,
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
      await deleteFromR2(videoObjectKey).catch(() => {})
      return NextResponse.json({ success: false, error: `Database error: ${dbError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      videoId: videoData.id,
      videoUrl,
      thumbnailUrl,
      message: "Video uploaded successfully",
    })
  } catch (err: unknown) {
    if (videoObjectKey) {
      await deleteFromR2(videoObjectKey).catch(() => {})
    }

    console.error("[channel-video] Upload error:", err)

    return NextResponse.json(
      { success: false, error: formatUploadErrorMessage(err, "Video upload failed") },
      { status: 500 },
    )
  }
}
