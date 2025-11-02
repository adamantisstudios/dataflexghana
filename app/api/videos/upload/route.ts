import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

async function validateAndCompressVideo(file: File): Promise<{ buffer: Buffer; isValid: boolean; error?: string }> {
  try {
    const buffer = await file.arrayBuffer()
    const sizeInMB = buffer.byteLength / 1024 / 1024

    // Validate file size (max 100MB for upload)
    if (sizeInMB > 100) {
      return {
        buffer: Buffer.from(buffer),
        isValid: false,
        error: `File too large: ${sizeInMB.toFixed(2)}MB. Maximum is 100MB.`,
      }
    }

    // Validate MIME type
    if (!file.type.startsWith("video/")) {
      return {
        buffer: Buffer.from(buffer),
        isValid: false,
        error: "File must be a video",
      }
    }

    console.log(`[v0] Video file validated: ${sizeInMB.toFixed(2)}MB`)

    return {
      buffer: Buffer.from(buffer),
      isValid: true,
    }
  } catch (error) {
    return {
      buffer: Buffer.alloc(0),
      isValid: false,
      error: error instanceof Error ? error.message : "Failed to validate video",
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get("x-agent-id")
    const agentPhone = request.headers.get("x-agent-phone")

    if (!authToken || !agentPhone) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authentication headers (x-agent-id, x-agent-phone)" },
        { status: 401 },
      )
    }

    const formData = await request.formData()
    const file = (formData.get("file") || formData.get("video")) as File
    const channelId = formData.get("channelId") as string
    const title = formData.get("title") as string
    const duration = Number.parseInt(formData.get("duration") as string) || 0

    if (!file || !channelId || !title) {
      return NextResponse.json({ error: "Missing required fields: file, channelId, and title" }, { status: 400 })
    }

    if (duration > 60) {
      return NextResponse.json({ error: "Video must be 60 seconds or less" }, { status: 400 })
    }

    const validation = await validateAndCompressVideo(file)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const buffer = validation.buffer
    const originalSize = buffer.byteLength
    const fileName = `${channelId}/${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`

    console.log("[v0] Attempting to upload video to Supabase storage:", {
      bucket: "videos",
      fileName,
      fileSize: (originalSize / 1024 / 1024).toFixed(2) + "MB",
    })

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("videos")
      .upload(fileName, buffer, {
        contentType: "video/mp4",
        upsert: false,
      })

    if (uploadError) {
      console.error("[v0] Supabase storage upload error:", {
        message: uploadError.message,
        status: uploadError.status,
        statusCode: uploadError.statusCode,
        error: uploadError,
      })
      return NextResponse.json(
        {
          error: `Storage upload failed: ${uploadError.message}`,
          details: uploadError.message,
          bucket: "videos",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Video uploaded to storage successfully:", uploadData.path)

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage.from("videos").getPublicUrl(uploadData.path)

    console.log("[v0] Attempting to create video record in database")

    const { data: videoData, error: dbError } = await supabaseAdmin
      .from("videos")
      .insert({
        channel_id: channelId,
        created_by: authToken,
        agent_id: authToken,
        title,
        video_url: publicUrlData.publicUrl,
        duration,
        file_size: buffer.byteLength,
        original_file_size: originalSize,
        status: "published",
      })
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Supabase database error:", {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint,
        error: dbError,
      })
      return NextResponse.json(
        {
          error: `Database error: ${dbError.message}`,
          details: dbError.details || dbError.message,
          code: dbError.code,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Video record created successfully:", videoData.id)

    return NextResponse.json({
      success: true,
      videoId: videoData.id,
      url: publicUrlData.publicUrl,
      message: "Video uploaded successfully",
      fileSize: (originalSize / 1024 / 1024).toFixed(2),
    })
  } catch (error) {
    console.error("[v0] Upload route error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      {
        error: errorMessage,
        type: error instanceof Error ? error.constructor.name : "Unknown",
      },
      { status: 500 },
    )
  }
}
