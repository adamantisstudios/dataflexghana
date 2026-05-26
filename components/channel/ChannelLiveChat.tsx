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
        className="fixed bottom-24 left-6 z-40 h-12 w-12 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center"
        title="Live chat"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-24 left-6 z-40 w-80 max-w-[calc(100vw-3rem)] rounded-2xl shadow-xl border bg-white dark:bg-slate-900 flex flex-col max-h-96">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-semibold">Live chat</span>
        <button type="button" className="text-xs text-muted-foreground" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto p-2 space-y-2 text-sm min-h-[120px]">
        {messages.map((m) => (
          <li
            key={m.id}
            className={`rounded-lg px-2 py-1 ${
              m.sender_agent_id === hostAgentId
                ? "bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200"
                : "bg-slate-100 dark:bg-slate-800"
            }`}
          >
            <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              {m.sender_agent_id === hostAgentId ? "★ Host" : m.sender_name}
            </p>
            <p className="break-words">{m.message}</p>
          </li>
        ))}
      </ul>
      <div className="flex gap-1 p-2 border-t">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something…"
          className="h-9 text-sm"
          onKeyDown={(e) => e.key === "Enter" && void send()}
        />
        <Button type="button" size="icon" className="h-9 w-9 shrink-0" disabled={sending} onClick={() => void send()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
