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
    <div className="relative z-10 mx-4 mb-3 h-[200px] w-full max-w-[120px]">
      <VoiceVideoFrame
        participant={hostTrack.participant}
        publication={hostTrack.publication}
        badge="host"
        variant="tile"
        className="h-full w-full"
      />
    </div>
  )
}
