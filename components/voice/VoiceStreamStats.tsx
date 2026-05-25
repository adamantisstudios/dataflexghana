"use client"

import { useEffect, useMemo, useState } from "react"
import { useParticipants } from "@livekit/components-react"
import { TrendingUp, Users } from "lucide-react"

export function VoiceStreamStats({ sessionStart }: { sessionStart: number }) {
  const participants = useParticipants()
  const listenerCount = participants.filter((p) => {
    try {
      const meta = p.metadata ? JSON.parse(p.metadata) : {}
      const role = meta.role || p.attributes?.role || "listener"
      return role === "listener"
    } catch {
      return true
    }
  }).length

  const [samples, setSamples] = useState<number[]>([])
  const [peak, setPeak] = useState(0)

  useEffect(() => {
    const n = Math.max(listenerCount, participants.length - 1)
    setSamples((prev) => [...prev.slice(-24), n])
    setPeak((p) => Math.max(p, n))
  }, [listenerCount, participants.length])

  const avgListenMin = useMemo(() => {
    const elapsedMin = Math.max(1, Math.floor((Date.now() - sessionStart) / 60000))
    return elapsedMin
  }, [sessionStart])

  const trend = samples.length >= 2 ? samples[samples.length - 1] - samples[samples.length - 2] : 0

  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/80 backdrop-blur-md px-2 py-1.5 text-[10px] text-slate-300 shrink-0">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3 text-emerald-400" />
          <span className="text-white font-semibold tabular-nums">{listenerCount}</span> listening
        </span>
        <span className="inline-flex items-center gap-1">
          <TrendingUp className={`h-3 w-3 ${trend >= 0 ? "text-emerald-400" : "text-amber-400"}`} />
          peak <span className="text-white font-medium">{peak}</span>
        </span>
        <span>~{avgListenMin}m session</span>
      </div>
    </div>
  )
}
