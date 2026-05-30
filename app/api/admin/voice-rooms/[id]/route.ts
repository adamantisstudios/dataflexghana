import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { deleteVoiceRoomEgressArtifacts, getLiveKitRoomService } from "@/lib/livekit-server"

export const dynamic = "force-dynamic"

/** Delete an ended voice room row and best-effort remove LiveKit egress files. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const { id } = await params
    const db = getAdminClient()
    const { data: room, error: fetchErr } = await db.from("voice_rooms").select("*").eq("id", id).maybeSingle()

    if (fetchErr || !room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (room.is_active) {
      return NextResponse.json({ error: "End the room before deleting its recording" }, { status: 400 })
    }

    try {
      await getLiveKitRoomService().deleteRoom(room.room_name)
    } catch {
      /* room may already be gone on LiveKit */
    }

    await deleteVoiceRoomEgressArtifacts(room.room_name)

    await db.from("voice_room_chats").delete().eq("room_name", room.room_name)

    const { error: deleteErr } = await db.from("voice_rooms").delete().eq("id", id)
    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[admin/voice-rooms DELETE]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete recording" },
      { status: 500 },
    )
  }
}
