"use client"

import { useCallback, useEffect, useState } from "react"
import { RoomEvent } from "livekit-client"
import { useLocalParticipant, useRoomContext } from "@livekit/components-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { BarChart3 } from "lucide-react"
import { VOICE_TOPIC_POLL } from "@/lib/voice-room-topics"
import { decodeVoiceData, encodeVoiceData, type VoicePollPayload, type VoicePollVotePayload } from "@/lib/voice-room-data"

type ActivePoll = VoicePollPayload & { votes: number[] }

type Props = {
  isAdmin?: boolean
  compact?: boolean
}

export function VoicePollPanel({ isAdmin, compact }: Props) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const [poll, setPoll] = useState<ActivePoll | null>(null)
  const [question, setQuestion] = useState("")
  const [optA, setOptA] = useState("Yes")
  const [optB, setOptB] = useState("No")
  const [optC, setOptC] = useState("")

  useEffect(() => {
    const onData = (payload: Uint8Array, _p?: unknown, _k?: unknown, topic?: string) => {
      if (topic !== VOICE_TOPIC_POLL) return
      const msg = decodeVoiceData(payload)
      if (!msg) return
      if (msg.type === "poll") {
        setPoll({ ...msg, votes: msg.options.map(() => 0) })
        const endsIn = Math.max(0, msg.endsAt - Date.now())
        setTimeout(() => setPoll((p) => (p?.pollId === msg.pollId ? p : p)), endsIn)
      }
      if (msg.type === "poll-vote") {
        setPoll((prev) => {
          if (!prev || prev.pollId !== msg.pollId) return prev
          const votes = [...prev.votes]
          if (msg.optionIndex >= 0 && msg.optionIndex < votes.length) {
            votes[msg.optionIndex] += 1
          }
          return { ...prev, votes }
        })
      }
    }
    room.on(RoomEvent.DataReceived, onData)
    return () => room.off(RoomEvent.DataReceived, onData)
  }, [room])

  const startPoll = useCallback(async () => {
    const options = [optA.trim(), optB.trim(), optC.trim()].filter(Boolean)
    if (!question.trim() || options.length < 2) return
    const payload: VoicePollPayload = {
      type: "poll",
      pollId: `poll-${Date.now()}`,
      question: question.trim(),
      options,
      endsAt: Date.now() + 30_000,
    }
    await localParticipant.publishData(encodeVoiceData(payload), {
      reliable: true,
      topic: VOICE_TOPIC_POLL,
    })
    setPoll({ ...payload, votes: options.map(() => 0) })
    setTimeout(() => {
      setPoll((p) => (p?.pollId === payload.pollId ? p : p))
    }, 30_000)
  }, [question, optA, optB, optC, localParticipant])

  const vote = async (index: number) => {
    if (!poll) return
    const payload: VoicePollVotePayload = {
      type: "poll-vote",
      pollId: poll.pollId,
      optionIndex: index,
      voterName: localParticipant.name || "Guest",
    }
    await localParticipant.publishData(encodeVoiceData(payload), {
      reliable: true,
      topic: VOICE_TOPIC_POLL,
    })
    setPoll((prev) => {
      if (!prev) return prev
      const votes = [...prev.votes]
      votes[index] += 1
      return { ...prev, votes }
    })
  }

  const totalVotes = poll?.votes.reduce((a, b) => a + b, 0) ?? 0

  if (!isAdmin && !poll) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={compact ? "icon" : "sm"}
          className={
            compact
              ? "h-9 w-9 border-white/20 bg-slate-800/80 text-white"
              : "h-9 border-white/20 bg-slate-800/80 text-slate-100 text-xs"
          }
          title="Poll"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-slate-900 border-white/20 text-slate-100 p-3" align="center">
        {isAdmin && !poll && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-white">Quick poll</p>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Question"
              className="h-8 text-xs bg-slate-800 border-white/20"
            />
            <Input value={optA} onChange={(e) => setOptA(e.target.value)} className="h-8 text-xs bg-slate-800 border-white/20" />
            <Input value={optB} onChange={(e) => setOptB(e.target.value)} className="h-8 text-xs bg-slate-800 border-white/20" />
            <Input value={optC} onChange={(e) => setOptC(e.target.value)} placeholder="Option C (optional)" className="h-8 text-xs bg-slate-800 border-white/20" />
            <Button size="sm" className="w-full h-8 bg-[#0E8F3D] text-white text-xs" onClick={() => void startPoll()}>
              Start 30s poll
            </Button>
          </div>
        )}
        {poll && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white">{poll.question}</p>
            {poll.options.map((opt, i) => {
              const pct = totalVotes > 0 ? Math.round((poll.votes[i] / totalVotes) * 100) : 0
              return (
                <div key={opt} className="space-y-1">
                  {!isAdmin ? (
                    <button
                      type="button"
                      className="w-full text-left text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
                      onClick={() => void vote(i)}
                    >
                      {opt}
                    </button>
                  ) : (
                    <p className="text-xs text-slate-300">{opt}</p>
                  )}
                  <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500">{pct}% ({poll.votes[i]} votes)</p>
                </div>
              )
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
