"use client"

import { useMemo } from "react"
import { VideoTrack, useParticipants } from "@livekit/components-react"
import { Track } from "livekit-client"
import { getParticipantRole, isHostParticipant } from "@/components/voice/voice-participant-utils"

/** Subscribed admin/host camera — hidden when host is not publishing video. */
export function HostVideoPanel() {
  const participants = useParticipants()

  const hostTrack = useMemo(() => {
    for (const p of participants) {
      if (p.isLocal) continue
      const role = getParticipantRole(p)
      if (!isHostParticipant(p.identity, role)) continue
      const pub = p.getTrackPublication(Track.Source.Camera)
      if (!pub?.track || pub.isMuted) continue
      return {
        participant: p,
        publication: pub,
        source: Track.Source.Camera,
      }
    }
    return null
  }, [participants])

  if (!hostTrack) return null

  return (
    <div className="mx-4 mb-3 rounded-xl overflow-hidden border border-white/15 bg-black/60 shadow-lg">
      <div className="px-2 py-1 bg-slate-900/80 border-b border-white/10 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium">
          Host video
        </span>
        <span className="text-[10px] text-slate-400">Live</span>
      </div>
      <div className="relative aspect-video max-h-[200px] w-full bg-slate-950">
        <VideoTrack trackRef={hostTrack} className="w-full h-full object-cover" />
      </div>
    </div>
  )
}
