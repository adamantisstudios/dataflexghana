import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { getLiveKitRoomService, listRecordings } from "@/lib/livekit-server"

export const dynamic = "force-dynamic"

export async function POST(
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

    try {
      await getLiveKitRoomService().deleteRoom(room.room_name)
    } catch (err) {
      console.warn("[voice-rooms/end] deleteRoom:", err)
    }

    const recordings = await listRecordings(room.room_name)
    const recording_url = recordings.find((r) => r.downloadUrl)?.downloadUrl ?? room.recording_url

    const { data: updated, error } = await db
      .from("voice_rooms")
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
        recording_url,
      })
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, room: updated, recordings })
  } catch (e) {
    console.error("[admin/voice-rooms/end]", e)
    return NextResponse.json({ error: "Failed to end room" }, { status: 500 })
  }
}
