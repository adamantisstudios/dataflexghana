export const runtime = "nodejs"
export const maxDuration = 300

import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { requireEnv } from "@/lib/r2-env"
import { buildVideoObjectKey, createR2PresignedPutUrl } from "@/lib/r2-presigned-upload"
import { formatUploadErrorMessage } from "@/lib/upload-error-messages"
import { canManageChannelContent } from "@/lib/channel-content-permission"

const MAX_SIZE_MB = 100

function getInputExtension(fileName: string, contentType: string): string {
  if (/\.mp4$/i.test(fileName) || contentType.includes("mp4")) return "mp4"
  if (/\.mov$/i.test(fileName) || contentType.includes("quicktime")) return "mov"
  if (/\.webm$/i.test(fileName) || contentType.includes("webm")) return "webm"
  return "mp4"
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAgent(request)
    if (!authResult.success || !authResult.user) {
      return createAuthErrorResponse(authResult.error || "Agent authentication required")
    }
    const agent = authResult.user

    const body = await request.json()
    const channelId = String(body.channelId || "").trim()

    const contentAccess = await canManageChannelContent(supabaseAdmin, channelId, agent)
    if (!contentAccess.allowed) {
      return NextResponse.json({ success: false, error: contentAccess.error }, { status: 403 })
    }
    const fileName = String(body.fileName || "video.mp4")
    const contentType = String(body.contentType || "video/mp4")
    const fileSize = Number(body.fileSize || 0)
    const duration = Number(body.duration || 0)
    const title = String(body.title || "").trim()

    if (!channelId || !title) {
      return NextResponse.json(
        { success: false, error: "Channel ID and title are required" },
        { status: 400 },
      )
    }

    const sizeMB = fileSize / 1024 / 1024
    if (fileSize <= 0 || sizeMB > MAX_SIZE_MB) {
      return NextResponse.json(
        {
          success: false,
          error: `Video must be under ${MAX_SIZE_MB}MB. Try lower quality or trim the clip.`,
        },
        { status: 400 },
      )
    }

    if (duration > 120) {
      return NextResponse.json(
        {
          success: false,
          error: `Video duration exceeds 2 minutes (${(duration / 60).toFixed(1)} min). Maximum 120 seconds.`,
        },
        { status: 400 },
      )
    }

    const ext = getInputExtension(fileName, contentType)
    const objectKey = buildVideoObjectKey(channelId, ext)
    const bucket = requireEnv("R2_BUCKET_NAME")

    const uploadUrl = await createR2PresignedPutUrl(objectKey, contentType || "video/mp4", bucket)

    return NextResponse.json({
      success: true,
      uploadUrl,
      objectKey,
      contentType: contentType || "video/mp4",
    })
  } catch (err) {
    console.error("[videos/presign]", err)
    return NextResponse.json(
      { success: false, error: formatUploadErrorMessage(err, "Could not prepare upload") },
      { status: 500 },
    )
  }
}
