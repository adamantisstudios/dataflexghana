import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import {
  clearVoiceRoomChats,
  insertVoiceRoomChat,
  listVoiceRoomChats,
} from "@/lib/voice-room-chat"

export const dynamic = "force-dynamic"

function decodeRoomName(raw: string): string {
  try {
    return decodeURIComponent(raw).trim()
  } catch {
    return raw.trim()
  }
}

async function assertRoomExists(roomName: string) {
  const db = getAdminClient()
  const { data: room, error } = await db
    .from("voice_rooms")
    .select("room_name, is_active")
    .eq("room_name", roomName)
    .maybeSingle()

  if (error || !room) throw new Error("Voice room not found")
  return room
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomName: string }> },
) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const { roomName: raw } = await params
    const roomName = decodeRoomName(raw)
    await assertRoomExists(roomName)
    const chats = await listVoiceRoomChats(roomName)
    return NextResponse.json({ success: true, chats })
  } catch (e) {
    console.error("[admin/voice-rooms/chats GET]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load chat" },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomName: string }> },
) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const { roomName: raw } = await params
    const roomName = decodeRoomName(raw)
    await assertRoomExists(roomName)

    const body = await request.json()
    const message = String(body.message ?? "")
    const senderName = String(body.senderName ?? "Host").trim() || "Host"

    const chat = await insertVoiceRoomChat({
      roomName,
      senderAgentId: null,
      senderName,
      message,
    })

    return NextResponse.json({ success: true, chat })
  } catch (e) {
    console.error("[admin/voice-rooms/chats POST]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send message" },
      { status: 400 },
    )
  }
}

/** Clear all chat messages for the room. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomName: string }> },
) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const { roomName: raw } = await params
    const roomName = decodeRoomName(raw)
    await assertRoomExists(roomName)
    await clearVoiceRoomChats(roomName)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[admin/voice-rooms/chats DELETE]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to clear chat" },
      { status: 500 },
    )
  }
}
