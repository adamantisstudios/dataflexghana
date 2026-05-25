import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { muteAllSpeakersInRoom } from "@/lib/livekit-server"

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
    const { data: room } = await db.from("voice_rooms").select("room_name").eq("id", id).maybeSingle()
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    const mutedCount = await muteAllSpeakersInRoom(room.room_name)
    return NextResponse.json({ success: true, mutedCount })
  } catch (e) {
    console.error("[admin/voice-rooms/mute-all]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to mute speakers" },
      { status: 500 },
    )
  }
}
