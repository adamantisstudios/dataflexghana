import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import {
  isLiveKitRecordingEnabled,
  listRecordings,
  startVoiceRoomRecording,
  stopVoiceRoomRecording,
} from "@/lib/livekit-server"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const { id } = await params
    const db = getAdminClient()
    const { data: room } = await db.from("voice_rooms").select("*").eq("id", id).maybeSingle()
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    const recordings = await listRecordings(room.room_name)
    const primary =
      recordings.find((r) => r.downloadUrl) ||
      (room.recording_url ? { downloadUrl: room.recording_url, egressId: null, status: "stored", filename: null } : null)

    return NextResponse.json({
      success: true,
      room,
      recordings,
      downloadUrl: primary?.downloadUrl ?? null,
    })
  } catch (e) {
    console.error("[admin/voice-rooms/recording]", e)
    return NextResponse.json({ error: "Failed to fetch recording" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  if (!isLiveKitRecordingEnabled()) {
    return NextResponse.json({ error: "Recording is not enabled on this server" }, { status: 400 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const action = String(body.action ?? "").trim()

    const db = getAdminClient()
    const { data: room } = await db.from("voice_rooms").select("room_name").eq("id", id).maybeSingle()
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (action === "start") {
      const egressId = await startVoiceRoomRecording(room.room_name)
      return NextResponse.json({ success: true, egressId, recording: true })
    }

    if (action === "stop") {
      const egressId = String(body.egressId ?? "").trim()
      if (!egressId) {
        return NextResponse.json({ error: "egressId is required to stop recording" }, { status: 400 })
      }
      await stopVoiceRoomRecording(egressId)
      return NextResponse.json({ success: true, recording: false })
    }

    return NextResponse.json({ error: "action must be start or stop" }, { status: 400 })
  } catch (e) {
    console.error("[admin/voice-rooms/recording POST]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Recording action failed" },
      { status: 500 },
    )
  }
}
