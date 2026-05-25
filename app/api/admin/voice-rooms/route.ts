import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import {
  createVoiceRoom,
  getLiveKitParticipantCount,
  isLiveKitRecordingEnabled,
} from "@/lib/livekit-server"
import { notifyAgentsVoiceRoomCreated } from "@/lib/voice-room-notifications"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const db = getAdminClient()
    const { data, error } = await db
      .from("voice_rooms")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rooms = await Promise.all(
      (data || []).map(async (room) => {
        const participant_count = room.is_active
          ? await getLiveKitParticipantCount(room.room_name)
          : 0
        return { ...room, participant_count }
      }),
    )

    return NextResponse.json({
      success: true,
      rooms,
      recordingEnabled: isLiveKitRecordingEnabled(),
    })
  } catch (e) {
    console.error("[admin/voice-rooms GET]", e)
    return NextResponse.json({ error: "Failed to list voice rooms" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const region = String(body.region ?? "").trim()
    if (!region) {
      return NextResponse.json({ error: "region is required" }, { status: 400 })
    }

    // created_by references agents; admins are in admin_users — store null for admin-created rooms
    const { room, recordingWarning } = await createVoiceRoom(region, null)
    const notified = await notifyAgentsVoiceRoomCreated(region, room.room_name)

    const origin = request.nextUrl.origin
    const inviteUrl = `${origin}/agent/voice-room/${encodeURIComponent(room.room_name)}`

    return NextResponse.json({
      success: true,
      room,
      inviteUrl,
      agentsNotified: notified,
      recordingEnabled: isLiveKitRecordingEnabled(),
      ...(recordingWarning ? { recordingWarning } : {}),
    })
  } catch (e) {
    console.error("[admin/voice-rooms POST]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create voice room" },
      { status: 500 },
    )
  }
}
