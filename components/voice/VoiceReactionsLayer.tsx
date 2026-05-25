"use client"

import { useEffect, useState } from "react"
import { useRoomContext } from "@livekit/components-react"
import { VOICE_TOPIC_REACTION } from "@/lib/voice-room-topics"

type FloatingReaction = {
  id: string
  emoji: string
  x: number
}

export function VoiceReactionsLayer() {
  const room = useRoomContext()
  const [reactions, setReactions] = useState<FloatingReaction[]>([])

  useEffect(() => {
    room.registerTextStreamHandler(VOICE_TOPIC_REACTION, async (reader) => {
      try {
        const text = await reader.readAll()
        let emoji = text
        try {
          const parsed = JSON.parse(text) as { emoji?: string }
          if (parsed.emoji) emoji = parsed.emoji
        } catch {
          /* plain emoji string */
        }
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const x = 10 + Math.random() * 80
        setReactions((prev) => [...prev, { id, emoji, x }])
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== id))
        }, 2000)
      } catch (e) {
        console.error("[voice] reaction", e)
      }
    })
    return () => room.unregisterTextStreamHandler(VOICE_TOPIC_REACTION)
  }, [room])

  if (reactions.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {reactions.map((r) => (
        <span
          key={r.id}
          className="absolute bottom-28 text-3xl sm:text-4xl animate-voice-reaction-float"
          style={{ left: `${r.x}%` }}
        >
          {r.emoji}
        </span>
      ))}
    </div>
  )
}

export async function sendVoiceReaction(
  sendText: (text: string, opts: { topic: string }) => Promise<void>,
  emoji: string,
) {
  await sendText(JSON.stringify({ emoji }), { topic: VOICE_TOPIC_REACTION })
}
