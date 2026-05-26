"use client"

import { useMemo } from "react"
import { useParticipants } from "@livekit/components-react"
import { Track } from "livekit-client"
import { getParticipantRole, isHostParticipant } from "@/components/voice/voice-participant-utils"
import { VoiceVideoFrame } from "@/components/voice/VoiceVideoFrame"

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
      return { participant: p, publication: pub }
    }
    return null
  }, [participants])

  if (!hostTrack) return null

  return (
    <div className="mx-4 mb-3 rounded-xl overflow-hidden border border-[#3c4043] bg-black/60 shadow-lg">
      <div className="px-2 py-1 bg-[#292a2d] border-b border-[#3c4043] flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "#0E8F3D" }}>
          Host video
        </span>
        <span className="text-[10px] text-[#9aa0a6]">Live</span>
      </div>
      <VoiceVideoFrame
        participant={hostTrack.participant}
        publication={hostTrack.publication}
        maxWidthClass="max-w-none w-full"
        className="rounded-none max-w-none"
      />
    </div>
  )
}
