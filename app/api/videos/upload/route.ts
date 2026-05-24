export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { compressVideoBuffer } from "@/lib/compress-video"

const BUCKET = "teaching-media"
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
  let originalStoragePath: string | null = null

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

    const isMobileRequest = /mobile|android|iphone|ipad/i.test(request.headers.get("user-agent") || "")

    const formData = await request.formData()
    const file = formData.get("file") as File
    const channelId = formData.get("channelId") as string
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
          error: "Video too large. Please record at a lower quality or trim the video.",
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
    originalStoragePath = `channel-videos/${token}-original.${inputExt}`
    const compressedStoragePath = `channel-videos/${token}.mp4`

    const uploadTimeoutMs = isMobileRequest ? 120000 : 90000

    const uploadOriginalPromise = supabaseAdmin.storage.from(BUCKET).upload(originalStoragePath, rawBuffer, {
      contentType: file.type || "video/mp4",
      upsert: false,
    })

    const uploadTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Upload timed out. Please check your connection and try again.")), uploadTimeoutMs),
    )

    const { error: originalUploadError } = await Promise.race([uploadOriginalPromise, uploadTimeout])

    if (originalUploadError) {
      return NextResponse.json(
        { success: false, error: `Failed to upload video: ${originalUploadError.message}` },
        { status: 500 },
      )
    }

    let compressedBuffer: Buffer
    let compressedSize: number

    try {
      const compressed = await compressVideoBuffer(rawBuffer, inputExt)
      compressedBuffer = compressed.buffer
      compressedSize = compressed.size
    } catch (compressErr) {
      await supabaseAdmin.storage.from(BUCKET).remove([originalStoragePath]).catch(() => {})
      originalStoragePath = null
      const message = compressErr instanceof Error ? compressErr.message : "Video compression failed"
      return NextResponse.json({ success: false, error: message }, { status: 500 })
    }

    const { error: compressedUploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(compressedStoragePath, compressedBuffer, {
        contentType: "video/mp4",
        upsert: true,
      })

    if (compressedUploadError) {
      await supabaseAdmin.storage.from(BUCKET).remove([originalStoragePath]).catch(() => {})
      originalStoragePath = null
      return NextResponse.json(
        { success: false, error: `Failed to save compressed video: ${compressedUploadError.message}` },
        { status: 500 },
      )
    }

    await supabaseAdmin.storage.from(BUCKET).remove([originalStoragePath]).catch(() => {})
    originalStoragePath = null

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(compressedStoragePath)
    const videoUrl = urlData.publicUrl

    let thumbnailUrl = ""
    try {
      if (thumbnailFile) {
        const thumbName = `channel-videos/thumbnails/${channelId}-${Date.now()}.jpg`
        const thumbnailBuffer = await readFileBuffer(thumbnailFile)
        const { error: thumbError } = await supabaseAdmin.storage.from(BUCKET).upload(thumbName, thumbnailBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        })
        if (!thumbError) {
          const { data: thumbUrlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(thumbName)
          thumbnailUrl = thumbUrlData.publicUrl
        }
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
        file_size: compressedSize,
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
      await supabaseAdmin.storage.from(BUCKET).remove([compressedStoragePath]).catch(() => {})
      return NextResponse.json({ success: false, error: `Database error: ${dbError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      videoId: videoData.id,
      videoUrl,
      thumbnailUrl,
      message: "Video uploaded and compressed successfully",
    })
  } catch (err: unknown) {
    if (originalStoragePath) {
      await supabaseAdmin.storage.from(BUCKET).remove([originalStoragePath]).catch(() => {})
    }

    console.error("[channel-video] Upload error:", err)

    let userMessage = err instanceof Error ? err.message : "Upload failed. Please try again."
    if (userMessage.includes("network") || userMessage.includes("timeout") || userMessage.includes("ECONN")) {
      userMessage = "Network connection issue. Please check your internet and try again."
    }

    return NextResponse.json({ success: false, error: userMessage }, { status: 500 })
  }
}
