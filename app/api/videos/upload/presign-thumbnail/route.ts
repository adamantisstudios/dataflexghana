export const runtime = "nodejs"
export const maxDuration = 120

import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { deleteFromR2, getR2PublicUrl } from "@/lib/r2-client"
import { requireEnv } from "@/lib/r2-env"
import { createR2PresignedPutUrl } from "@/lib/r2-presigned-upload"
import { formatUploadErrorMessage } from "@/lib/upload-error-messages"
import { canManageChannelContent } from "@/lib/channel-content-permission"

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAgent(request)
    if (!authResult.success || !authResult.user) {
      return createAuthErrorResponse(authResult.error || "Agent authentication required")
    }
    const agent = authResult.user

    const body = await request.json()
    const channelId = String(body.channelId || "").trim()
    const fileSize = Number(body.fileSize || 0)

    if (!channelId) {
      return NextResponse.json({ success: false, error: "Channel ID is required" }, { status: 400 })
    }

    const contentAccess = await canManageChannelContent(supabaseAdmin, channelId, agent)
    if (!contentAccess.allowed) {
      return NextResponse.json({ success: false, error: contentAccess.error }, { status: 403 })
    }

    if (fileSize > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Thumbnail must be under 5MB" }, { status: 400 })
    }

    const bucket = requireEnv("R2_BUCKET_NAME")
    const objectKey = `channel-videos/thumbnails/${channelId}-${Date.now()}.jpg`
    const uploadUrl = await createR2PresignedPutUrl(objectKey, "image/jpeg", bucket)

    return NextResponse.json({
      success: true,
      uploadUrl,
      objectKey,
      contentType: "image/jpeg",
    })
  } catch (err) {
    console.error("[videos/presign-thumbnail]", err)
    return NextResponse.json(
      { success: false, error: formatUploadErrorMessage(err, "Could not prepare thumbnail upload") },
      { status: 500 },
    )
  }
}
