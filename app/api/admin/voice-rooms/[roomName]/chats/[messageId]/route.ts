import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { deleteVoiceRoomChat } from "@/lib/voice-room-chat"

export const dynamic = "force-dynamic"

function decodeRoomName(raw: string): string {
  try {
    return decodeURIComponent(raw).trim()
  } catch {
    return raw.trim()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomName: string; messageId: string }> },
) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const { roomName: rawRoom, messageId } = await params
    const roomName = decodeRoomName(rawRoom)
    const id = String(messageId ?? "").trim()
    if (!id) {
      return NextResponse.json({ error: "messageId is required" }, { status: 400 })
    }

    await deleteVoiceRoomChat(roomName, id)
    return NextResponse.json({ success: true, id })
  } catch (e) {
    console.error("[admin/voice-rooms/chats/message DELETE]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete message" },
      { status: 500 },
    )
  }
}
