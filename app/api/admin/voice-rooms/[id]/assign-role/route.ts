import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { updateParticipantRole, type VoiceParticipantRole } from "@/lib/livekit-server"

export const dynamic = "force-dynamic"

const ROLES: VoiceParticipantRole[] = ["listener", "speaker", "moderator", "admin"]

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
    const role = String(body.role ?? "").trim() as VoiceParticipantRole

    if (!identity) {
      return NextResponse.json({ error: "identity is required" }, { status: 400 })
    }
    if (!ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data: room } = await db.from("voice_rooms").select("room_name").eq("id", id).maybeSingle()
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    await updateParticipantRole(room.room_name, identity, role)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[admin/voice-rooms/assign-role]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to assign role" },
      { status: 500 },
    )
  }
}
