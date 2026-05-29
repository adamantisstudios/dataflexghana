"use client"

import { useEffect, useMemo, useState } from "react"
import { useParticipants } from "@livekit/components-react"
import { TrendingUp, Users } from "lucide-react"
import {
  getParticipantRole,
  isHostParticipant,
  isSpeakerRole,
} from "@/components/voice/voice-participant-utils"

export function VoiceStreamStats({ sessionStart }: { sessionStart: number }) {
  const participants = useParticipants()
  const listenerCount = participants.filter((p) => {
    if (p.isLocal) return false
    const role = getParticipantRole(p)
    if (isSpeakerRole(role) || isHostParticipant(p.identity, role)) return false
    return true
  }).length

  const [samples, setSamples] = useState<number[]>([])
  const [peak, setPeak] = useState(0)

  useEffect(() => {
    const n = Math.max(listenerCount, participants.filter((p) => !p.isLocal).length)
    setSamples((prev) => [...prev.slice(-24), n])
    setPeak((p) => Math.max(p, n))
  }, [listenerCount, participants.length])

  const elapsedMin = useMemo(() => {
    return Math.max(1, Math.floor((Date.now() - sessionStart) / 60000))
  }, [sessionStart, participants.length])

  const trend = samples.length >= 2 ? samples[samples.length - 1] - samples[samples.length - 2] : 0

  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/90 backdrop-blur-md px-2 py-1 text-[9px] sm:text-[10px] text-slate-300 shrink min-w-0 max-w-[min(100%,14rem)] overflow-hidden">
      <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-0.5">
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          <Users className="h-3 w-3 text-emerald-400 shrink-0" />
          <span className="text-white font-semibold tabular-nums">{listenerCount}</span>
          <span className="text-slate-400">listening</span>
        </span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          <TrendingUp
            className={`h-3 w-3 shrink-0 ${trend >= 0 ? "text-emerald-400" : "text-amber-400"}`}
          />
          <span className="text-slate-400">peak</span>
          <span className="text-white font-medium tabular-nums">{peak}</span>
        </span>
        <span className="whitespace-nowrap text-slate-400">~{elapsedMin}m session</span>
      </div>
    </div>
  )
}
