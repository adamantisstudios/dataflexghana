export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { uploadBufferToR2 } from "@/lib/r2-client"

const MAX_SIZE_MB = 100

function getInputExtension(file: File): string {
  if (file.name?.match(/\.mp4$/i) || file.type.includes("mp4")) return "mp4"
  if (file.name?.match(/\.mov$/i) || file.type.includes("quicktime")) return "mov"
  if (file.name?.match(/\.webm$/i) || file.type.includes("webm")) return "webm"
  return "mp4"
}

/** Generic authenticated video upload to R2 (channel messages, etc.). */
export async function POST(request: NextRequest) {
  const authResult = await authenticateAgent(request)
  if (!authResult.success || !authResult.user) {
    return createAuthErrorResponse(authResult.error || "Agent authentication required")
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const channelId = String(formData.get("channelId") || "general")
    const folder = String(formData.get("folder") || "videos")

    if (!file) {
      return NextResponse.json({ success: false, error: "Video file is required" }, { status: 400 })
    }

    const isValidVideo =
      file.type.startsWith("video/") ||
      file.type === "application/octet-stream" ||
      /\.(mp4|webm|mov|avi|mkv)$/i.test(file.name || "")

    if (!isValidVideo) {
      return NextResponse.json({ success: false, error: "File must be a video" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.byteLength / 1024 / 1024 > MAX_SIZE_MB) {
      return NextResponse.json({ success: false, error: "Video must be under 100MB" }, { status: 400 })
    }

    const ext = getInputExtension(file)
    const safeFolder = folder.replace(/[^a-z0-9-_]/gi, "")
    const objectKey = `${safeFolder}/${channelId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const url = await uploadBufferToR2(buffer, objectKey, file.type || "video/mp4")

    return NextResponse.json({
      success: true,
      url,
      fileName: file.name,
      fileSize: buffer.byteLength,
    })
  } catch (err) {
    console.error("[upload/video] error:", err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    )
  }
}
