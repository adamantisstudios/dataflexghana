"use client"

import { useLocalParticipant } from "@livekit/components-react"
import { Track } from "livekit-client"
import { VoiceVideoFrame } from "@/components/voice/VoiceVideoFrame"

/** Self-preview PiP — fixed position per VoIP spec. */
export function AgentLocalVideoPip() {
  const { localParticipant, isCameraEnabled } = useLocalParticipant()
  const pub = localParticipant.getTrackPublication(Track.Source.Camera)

  if (!isCameraEnabled || !pub?.track || pub.isMuted) return null

  return (
    <VoiceVideoFrame
      participant={localParticipant}
      publication={pub}
      variant="preview"
      badge="agent"
      mirror
    />
  )
}
