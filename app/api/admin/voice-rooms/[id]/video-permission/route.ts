import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import {
  muteParticipantVideo,
  sendVideoPermissionCommand,
  updateParticipantVideoPermission,
} from "@/lib/livekit-server"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const { id } = await params
    const body = await request.json()
    const identity = String(body.identity ?? "").trim()
    const allowed = body.allowed === true
    if (!identity) {
      return NextResponse.json({ error: "identity is required" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data: room } = await db.from("voice_rooms").select("room_name").eq("id", id).maybeSingle()
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    await updateParticipantVideoPermission(room.room_name, identity, allowed)
    await sendVideoPermissionCommand(room.room_name, identity, allowed)
    // Mute remote camera server-side when revoking; agent re-enables after permission grant.
    try {
      await muteParticipantVideo(room.room_name, identity, !allowed)
    } catch {
      /* no published camera track yet */
    }

    return NextResponse.json({ success: true, allowed })
  } catch (e) {
    console.error("[admin/voice-rooms/video-permission]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update video permission" },
      { status: 500 },
    )
  }
}
