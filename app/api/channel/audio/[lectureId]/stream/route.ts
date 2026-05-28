import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { assertChannelMember } from "@/lib/channel-audio-auth"
import {
  extractR2ObjectKeyFromUrl,
  verifyAudioPlaybackToken,
} from "@/lib/channel-audio-playback"
import { getChannelAudioBucketName, getR2ObjectStream } from "@/lib/r2-client"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ lectureId: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const { lectureId } = await context.params
  const token = request.nextUrl.searchParams.get("token")

  let agentId: string | null = null

  if (token) {
    const verified = verifyAudioPlaybackToken(token, lectureId)
    if (!verified) {
      return NextResponse.json({ error: "Invalid or expired playback token" }, { status: 403 })
    }
    agentId = verified.agentId
  } else {
    const authResult = await authenticateAgent(request)
    if (!authResult.success || !authResult.user) {
      return createAuthErrorResponse(authResult.error || "Agent authentication required")
    }
    agentId = authResult.user.id
  }

  const db = getAdminClient()
  const { data: lectureRow, error: lectureError } = await db
    .from("channel_audio_lectures")
    .select("id, channel_id, audio_url")
    .eq("id", lectureId)
    .maybeSingle()

  if (lectureError || !lectureRow) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 })
  }

  const channelId = String(lectureRow.channel_id)
  const access = await assertChannelMember(db, channelId, agentId)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const objectKey = extractR2ObjectKeyFromUrl(String(lectureRow.audio_url))
  if (!objectKey) {
    return NextResponse.json({ error: "Invalid audio storage URL" }, { status: 500 })
  }

  const range = request.headers.get("range") ?? undefined

  try {
    const result = await getR2ObjectStream(objectKey, {
      bucketName: getChannelAudioBucketName(),
      range,
    })

    if (!result.Body) {
      return NextResponse.json({ error: "Audio file missing in storage" }, { status: 404 })
    }

    const headers = new Headers()
    headers.set("Content-Type", result.ContentType || "audio/mpeg")
    headers.set("Accept-Ranges", "bytes")
    headers.set("Cache-Control", "private, max-age=3600")
    if (result.ContentLength != null) {
      headers.set("Content-Length", String(result.ContentLength))
    }
    if (result.ContentRange) {
      headers.set("Content-Range", result.ContentRange)
    }

    return new NextResponse(result.Body.transformToWebStream(), {
      status: range && result.ContentRange ? 206 : 200,
      headers,
    })
  } catch (error) {
    console.error("[audio stream]", lectureId, objectKey, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to stream audio" },
      { status: 502 },
    )
  }
}
