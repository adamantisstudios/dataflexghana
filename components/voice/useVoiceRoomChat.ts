"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { RoomEvent } from "livekit-client"
import { useLocalParticipant, useRoomContext } from "@livekit/components-react"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import {
  decodeVoiceChatPayload,
  encodeVoiceChatPayload,
  type VoiceRoomChatRow,
} from "@/lib/voice-room-chat"
import { VOICE_TOPIC_CHAT } from "@/lib/voice-room-topics"

export type ChatMessage = {
  id: string
  senderName: string
  message: string
  timestamp: string
  senderAgentId?: string | null
}

function rowToMessage(row: VoiceRoomChatRow): ChatMessage {
  return {
    id: row.id,
    senderName: row.sender_name,
    message: row.message,
    timestamp: row.created_at,
    senderAgentId: row.sender_agent_id,
  }
}

type Options = {
  roomName: string
  senderName: string
  senderAgentId: string | null
  apiMode: "agent" | "admin"
}

export function useVoiceRoomChat({
  roomName,
  senderName,
  senderAgentId,
  apiMode,
}: Options) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const seenIds = useRef(new Set<string>())

  const apiBase =
    apiMode === "admin"
      ? `/api/admin/voice-rooms/${encodeURIComponent(roomName)}/chats`
      : `/api/agent/voice-rooms/${encodeURIComponent(roomName)}/chats`

  const authHeaders = apiMode === "admin" ? getAdminAuthHeaders() : getAgentAuthHeaders()

  const addMessage = useCallback((msg: ChatMessage) => {
    if (seenIds.current.has(msg.id)) return
    seenIds.current.add(msg.id)
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev
      return [...prev, msg].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )
    })
  }, [])

  const removeMessage = useCallback((id: string) => {
    seenIds.current.delete(id)
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const clearMessages = useCallback(() => {
    seenIds.current.clear()
    setMessages([])
  }, [])

  const broadcastPayload = useCallback(
    async (payload: Parameters<typeof encodeVoiceChatPayload>[0]) => {
      await localParticipant.publishData(encodeVoiceChatPayload(payload), {
        reliable: true,
        topic: VOICE_TOPIC_CHAT,
      })
    },
    [localParticipant],
  )

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(apiBase, { headers: authHeaders, credentials: "same-origin" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load chat")
      const rows = (data.chats || []) as VoiceRoomChatRow[]
      seenIds.current.clear()
      const list = rows.map(rowToMessage)
      rows.forEach((r) => seenIds.current.add(r.id))
      setMessages(list)
    } catch (e) {
      console.error("[voice chat] load", e)
    } finally {
      setLoading(false)
    }
  }, [apiBase, authHeaders])

  useEffect(() => {
    const onData = (
      payload: Uint8Array,
      _participant?: unknown,
      _kind?: unknown,
      topic?: string,
    ) => {
      if (topic !== VOICE_TOPIC_CHAT) return
      const parsed = decodeVoiceChatPayload(payload)
      if (!parsed) return

      if (parsed.type === "chat") {
        addMessage({
          id: parsed.id,
          senderName: parsed.senderName,
          message: parsed.message,
          timestamp: parsed.timestamp,
          senderAgentId: parsed.senderAgentId ?? null,
        })
      } else if (parsed.type === "chat-delete") {
        removeMessage(parsed.id)
      } else if (parsed.type === "chat-clear") {
        clearMessages()
      }
    }

    room.on(RoomEvent.DataReceived, onData)
    return () => {
      room.off(RoomEvent.DataReceived, onData)
    }
  }, [room, addMessage, removeMessage, clearMessages])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || sending) return

      setSending(true)
      try {
        const res = await fetch(apiBase, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          credentials: "same-origin",
          body: JSON.stringify({
            message: trimmed,
            senderName,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Send failed")

        const chat = data.chat as VoiceRoomChatRow
        const msg = rowToMessage(chat)
        addMessage(msg)

        await broadcastPayload({
          type: "chat",
          id: msg.id,
          senderName: msg.senderName,
          message: msg.message,
          timestamp: msg.timestamp,
          senderAgentId: msg.senderAgentId ?? senderAgentId,
        })
      } finally {
        setSending(false)
      }
    },
    [apiBase, authHeaders, senderName, senderAgentId, sending, addMessage, broadcastPayload],
  )

  const deleteMessage = useCallback(
    async (messageId: string) => {
      const res = await fetch(
        `/api/admin/voice-rooms/${encodeURIComponent(roomName)}/chats/${encodeURIComponent(messageId)}`,
        { method: "DELETE", headers: getAdminAuthHeaders() },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Delete failed")
      removeMessage(messageId)
      await broadcastPayload({ type: "chat-delete", id: messageId })
    },
    [roomName, removeMessage, broadcastPayload],
  )

  const clearChat = useCallback(async () => {
    const res = await fetch(
      `/api/admin/voice-rooms/${encodeURIComponent(roomName)}/chats`,
      { method: "DELETE", headers: getAdminAuthHeaders() },
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Clear failed")
    clearMessages()
    await broadcastPayload({ type: "chat-clear" })
  }, [roomName, clearMessages, broadcastPayload])

  return {
    messages,
    loading,
    sending,
    sendMessage,
    deleteMessage,
    clearChat,
    reload: loadHistory,
  }
}
