import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { muteParticipantAudio, updateParticipantRole } from "@/lib/livekit-server"

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
    if (!identity) {
      return NextResponse.json({ error: "identity is required" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data: room } = await db.from("voice_rooms").select("room_name").eq("id", id).maybeSingle()
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    await updateParticipantRole(room.room_name, identity, "speaker")
    await muteParticipantAudio(room.room_name, identity, false)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[admin/voice-rooms/unmute]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to unmute participant" },
      { status: 500 },
    )
  }
}
