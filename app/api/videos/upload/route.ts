export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

async function readFileBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function POST(request: NextRequest) {
  try {
    const authToken =
      request.headers.get("x-agent-id") || request.headers.get("authorization")?.split(" ")[1] || "mobile-user"
    const agentPhone = request.headers.get("x-agent-phone") || "unknown"

    const userAgent = request.headers.get("user-agent") || ""
    const isMobileRequest = /mobile|android|iphone|ipad/i.test(userAgent)

    console.log("[v0] Video upload request - Mobile:", isMobileRequest, "Agent:", authToken, "Phone:", agentPhone)

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
      console.error("[v0] No file provided in upload")
      return NextResponse.json({ success: false, error: "Video file is required" }, { status: 400 })
    }

    if (!channelId || !title) {
      console.error("[v0] Missing required fields - channelId:", channelId, "title:", title)
      return NextResponse.json({ success: false, error: "Channel ID and title are required" }, { status: 400 })
    }

    const isValidVideoType =
      file.type.startsWith("video/") ||
      file.type === "application/octet-stream" ||
      (isMobileRequest && file.name && /\.(mp4|webm|mov|avi|mkv)$/i.test(file.name))

    if (!isValidVideoType) {
      console.error("[v0] Invalid file type:", file.type, "Name:", file.name)
      return NextResponse.json(
        { success: false, error: `Unsupported file type: ${file.type}. Must be a video.` },
        { status: 400 },
      )
    }

    const buffer = await readFileBuffer(file)
    const sizeMB = buffer.byteLength / 1024 / 1024

    console.log("[v0] File size:", sizeMB.toFixed(2), "MB, Duration:", duration, "seconds")

    if (sizeMB > 100) {
      console.error("[v0] File too large:", sizeMB, "MB")
      return NextResponse.json(
        { success: false, error: `File too large (${sizeMB.toFixed(2)}MB). Maximum 100MB allowed.` },
        { status: 400 },
      )
    }

    if (duration > 120) {
      console.error("[v0] Video too long:", duration, "seconds")
      return NextResponse.json(
        {
          success: false,
          error: `Video duration exceeds 2 minutes (${(duration / 60).toFixed(1)} minutes). Maximum 120 seconds allowed.`,
        },
        { status: 400 },
      )
    }

    let fileExtension = "webm"
    let actualMimeType = file.type || "video/webm"

    if (file.type.includes("mp4") || file.name?.endsWith(".mp4") || file.name?.endsWith(".MP4")) {
      fileExtension = "mp4"
      actualMimeType = "video/mp4"
    } else if (file.type.includes("webm") || file.type === "application/octet-stream") {
      fileExtension = "webm"
      actualMimeType = "video/webm"
    } else if (file.type.includes("quicktime") || file.name?.endsWith(".mov")) {
      fileExtension = "mp4"
      actualMimeType = "video/mp4"
    }

    const filePath = `${channelId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`

    console.log("[v0] Uploading to storage - Path:", filePath, "MimeType:", actualMimeType)

    const uploadTimeoutMs = isMobileRequest ? 120000 : 60000

    const uploadPromise = supabaseAdmin.storage.from("videos").upload(filePath, buffer, {
      contentType: actualMimeType,
      upsert: false,
    })

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Upload timeout - please try again")), uploadTimeoutMs),
    )

    const { data: uploadData, error: uploadError } = (await Promise.race([uploadPromise, timeoutPromise])) as any

    if (uploadError) {
      console.error("[v0] Storage upload error:", uploadError)

      let errorMessage = uploadError.message || "Storage error"
      if (errorMessage.includes("timeout") || errorMessage.includes("network")) {
        errorMessage = "Network error during upload. Please check your connection and try again."
      } else if (errorMessage.includes("413")) {
        errorMessage = "File is too large for this network. Try a shorter or lower quality video."
      }

      return NextResponse.json({ success: false, error: `Storage error: ${errorMessage}` }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage.from("videos").getPublicUrl(uploadData.path)
    const videoUrl = urlData.publicUrl

    console.log("[v0] Video uploaded successfully - URL:", videoUrl)

    let thumbnailUrl = ""
    try {
      if (thumbnailFile) {
        const thumbName = `thumbnails/${channelId}-${Date.now()}.jpg`
        const thumbnailBuffer = await readFileBuffer(thumbnailFile)

        const { error: thumbError } = await supabaseAdmin.storage.from("videos").upload(thumbName, thumbnailBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        })

        if (!thumbError) {
          const { data: thumbUrlData } = supabaseAdmin.storage.from("videos").getPublicUrl(thumbName)
          thumbnailUrl = thumbUrlData.publicUrl
          console.log("[v0] Thumbnail uploaded:", thumbName)
        } else {
          console.warn("[v0] Thumbnail upload error:", thumbError)
        }
      } else {
        console.warn("[v0] No thumbnail provided, skipping thumbnail upload")
      }
    } catch (err) {
      console.warn("[v0] Thumbnail processing skipped:", err)
    }

    const { data: videoData, error: dbError } = await supabaseAdmin
      .from("videos")
      .insert({
        channel_id: channelId,
        created_by: authToken,
        title,
        description: description || "",
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration,
        file_size: buffer.byteLength,
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
      console.error("[v0] Database error:", dbError)
      return NextResponse.json({ success: false, error: `Database error: ${dbError.message}` }, { status: 500 })
    }

    console.log("[v0] Video record created - ID:", videoData.id)

    return NextResponse.json({
      success: true,
      videoId: videoData.id,
      videoUrl,
      thumbnailUrl,
      message: "Video uploaded successfully",
    })
  } catch (err: any) {
    console.error("[v0] Upload route error:", err)

    let userMessage = err.message || "Upload failed. Please try again."

    if (userMessage.includes("network") || userMessage.includes("timeout")) {
      userMessage = "Network connection issue. Please check your internet and try again."
    } else if (userMessage.includes("exceeded")) {
      userMessage = "Request exceeded size limit. Try uploading a shorter video."
    } else if (userMessage.includes("ECONNRESET") || userMessage.includes("ECONNREFUSED")) {
      userMessage = "Connection interrupted. Please check your network and try again."
    }

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
      },
      { status: 500 },
    )
  }
}
