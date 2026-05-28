import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAttachmentsBucketName, uploadBufferToR2 } from "@/lib/r2-client"
import { randomUUID } from "crypto"

export const dynamic = "force-dynamic"
export const maxDuration = 120

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

export async function POST(request: NextRequest) {
  const authResult = await authenticateAgent(request)
  if (!authResult.success || !authResult.user) {
    return createAuthErrorResponse(authResult.error || "Agent authentication required")
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const channelId = String(formData.get("channelId") || "general")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      return NextResponse.json({ error: "File must be under 25MB" }, { status: 400 })
    }

    const originalName = file.name || "attachment"
    const ext = originalName.includes(".") ? originalName.split(".").pop() : "bin"
    const buffer = Buffer.from(await file.arrayBuffer())
    const objectKey = `channels/${channelId}/attachments/${randomUUID()}.${ext}`
    const bucket = getAttachmentsBucketName()
    const url = await uploadBufferToR2(buffer, objectKey, file.type || "application/octet-stream", bucket)

    return NextResponse.json({
      success: true,
      attachment: {
        name: originalName,
        url,
        type: file.type || "application/octet-stream",
      },
    })
  } catch (error) {
    console.error("upload-attachment:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    )
  }
}
