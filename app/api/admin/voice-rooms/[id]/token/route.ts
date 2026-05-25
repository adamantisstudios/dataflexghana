import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { generateToken, getLiveKitWsUrl } from "@/lib/livekit-server"

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
    const { data: room } = await db.from("voice_rooms").select("*").eq("id", id).maybeSingle()
    if (!room?.is_active) {
      return NextResponse.json({ error: "Room not found or not active" }, { status: 404 })
    }

    const adminId = String(session.admin?.id ?? "admin")
    const adminName = String(session.admin?.full_name ?? session.admin?.username ?? "Admin")

    const token = await generateToken(`admin-${adminId}`, room.room_name, adminName, true, {
      role: "admin",
    })

    return NextResponse.json({
      success: true,
      token,
      serverUrl: getLiveKitWsUrl(),
      roomName: room.room_name,
    })
  } catch (e) {
    console.error("[admin/voice-rooms/token]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create token" },
      { status: 500 },
    )
  }
}
