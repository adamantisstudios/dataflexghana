import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { listRecordings } from "@/lib/livekit-server"

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
