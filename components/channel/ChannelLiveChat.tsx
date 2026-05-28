"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { realtimeManager } from "@/lib/realtime-manager"

type LiveMessage = {
  id: string
  sender_agent_id: string
  sender_name: string
  message: string
  created_at: string
}

type Props = {
  sessionId: string
  senderName: string
  senderAgentId: string
  hostAgentId: string
}

export function ChannelLiveChat({ sessionId, senderName, senderAgentId, hostAgentId }: Props) {
  const [messages, setMessages] = useState<LiveMessage[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [open, setOpen] = useState(false)

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/channel-live/${sessionId}/messages`, {
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      if (res.ok) setMessages(data.messages ?? [])
    } catch {
      /* ignore */
    }
  }, [sessionId])

  useEffect(() => {
    void loadMessages()
    const unsub = realtimeManager.subscribe(
      `channel_live_chat_${sessionId}`,
      "channel_live_messages",
      () => void loadMessages(),
      `session_id=eq.${sessionId}`,
    )
    return () => unsub()
  }, [sessionId, loadMessages])

  const send = async () => {
    const msg = text.trim()
    if (!msg) return
    setSending(true)
    try {
      const res = await fetch(`/api/channel-live/${sessionId}/messages`, {
        method: "POST",
        headers: getAgentAuthHeaders(),
        body: JSON.stringify({ message: msg, senderName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Send failed")
      setText("")
      void loadMessages()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send")
    } finally {
      setSending(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white shadow-md sm:left-6"
        title="Live chat"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 left-4 z-40 flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm flex-col rounded-2xl border border-gray-100 bg-white shadow-md sm:bottom-24 sm:left-6">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <span className="text-sm font-semibold text-gray-900">Live chat</span>
        <button type="button" className="text-xs text-gray-600 hover:text-gray-900" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
      <ul className="min-h-[140px] flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {messages.map((m) => (
          <li
            key={m.id}
            className={`rounded-lg px-2 py-1 ${
              m.sender_agent_id === hostAgentId
                ? "border border-green-200 bg-green-50"
                : "bg-gray-100"
            }`}
          >
            <p className="text-[10px] font-semibold text-green-700">
              {m.sender_agent_id === hostAgentId ? "★ Host" : m.sender_name}
            </p>
            <p className="break-words text-gray-900">{m.message}</p>
          </li>
        ))}
      </ul>
      <div className="sticky bottom-0 flex gap-2 border-t border-gray-100 bg-white p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something…"
          className="h-11 text-sm text-gray-900"
          onKeyDown={(e) => e.key === "Enter" && void send()}
        />
        <Button type="button" size="icon" className="h-11 w-11 shrink-0 bg-green-500 text-white hover:bg-green-600" disabled={sending} onClick={() => void send()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
