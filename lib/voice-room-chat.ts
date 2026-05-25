import { getAdminClient } from "@/lib/supabase-base"

export type VoiceRoomChatRow = {
  id: string
  room_name: string
  sender_agent_id: string | null
  sender_name: string
  message: string
  created_at: string
}

export type VoiceChatDataPayload =
  | {
      type: "chat"
      id: string
      senderName: string
      message: string
      timestamp: string
      senderAgentId?: string | null
    }
  | { type: "chat-delete"; id: string }
  | { type: "chat-clear" }

const MAX_MESSAGE_LENGTH = 2000
const HISTORY_LIMIT = 200

export function decodeVoiceChatPayload(payload: Uint8Array): VoiceChatDataPayload | null {
  try {
    const text = new TextDecoder().decode(payload)
    const parsed = JSON.parse(text) as VoiceChatDataPayload
    if (!parsed?.type) return null
    return parsed
  } catch {
    return null
  }
}

export function encodeVoiceChatPayload(payload: VoiceChatDataPayload): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(payload))
}

export async function assertVoiceRoomActive(roomName: string): Promise<void> {
  const db = getAdminClient()
  const { data: room, error } = await db
    .from("voice_rooms")
    .select("is_active")
    .eq("room_name", roomName)
    .maybeSingle()

  if (error || !room) {
    throw new Error("Voice room not found")
  }
  if (!room.is_active) {
    throw new Error("This voice conference has ended")
  }
}

export async function listVoiceRoomChats(roomName: string): Promise<VoiceRoomChatRow[]> {
  const db = getAdminClient()
  const { data, error } = await db
    .from("voice_room_chats")
    .select("*")
    .eq("room_name", roomName)
    .order("created_at", { ascending: true })
    .limit(HISTORY_LIMIT)

  if (error) throw new Error(error.message)
  return (data || []) as VoiceRoomChatRow[]
}

export async function insertVoiceRoomChat(input: {
  roomName: string
  senderAgentId: string | null
  senderName: string
  message: string
}): Promise<VoiceRoomChatRow> {
  const message = input.message.trim()
  if (!message) throw new Error("Message is required")
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message must be at most ${MAX_MESSAGE_LENGTH} characters`)
  }

  await assertVoiceRoomActive(input.roomName)

  const db = getAdminClient()
  const { data, error } = await db
    .from("voice_room_chats")
    .insert({
      room_name: input.roomName,
      sender_agent_id: input.senderAgentId,
      sender_name: input.senderName.trim() || "Guest",
      message,
    })
    .select("*")
    .single()

  if (error || !data) throw new Error(error?.message || "Failed to save message")
  return data as VoiceRoomChatRow
}

export async function deleteVoiceRoomChat(roomName: string, messageId: string): Promise<void> {
  const db = getAdminClient()
  const { error } = await db
    .from("voice_room_chats")
    .delete()
    .eq("id", messageId)
    .eq("room_name", roomName)

  if (error) throw new Error(error.message)
}

export async function clearVoiceRoomChats(roomName: string): Promise<void> {
  const db = getAdminClient()
  const { error } = await db.from("voice_room_chats").delete().eq("room_name", roomName)
  if (error) throw new Error(error.message)
}
