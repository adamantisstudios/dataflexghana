import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { notifyAgentsHostIsLive } from "@/lib/voice-room-notifications"

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
    const { data: room } = await db
      .from("voice_rooms")
      .select("room_name, region, is_active")
      .eq("id", id)
      .maybeSingle()

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }
    if (!room.is_active) {
      return NextResponse.json({ error: "Room is not active" }, { status: 400 })
    }

    const sent = await notifyAgentsHostIsLive(room.region, room.room_name)
    return NextResponse.json({ success: true, agentsNotified: sent })
  } catch (e) {
    console.error("[admin/voice-rooms/notify-live]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send notifications" },
      { status: 500 },
    )
  }
}
