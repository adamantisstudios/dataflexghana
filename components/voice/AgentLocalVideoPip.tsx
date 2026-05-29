"use client"

import { useLocalParticipant } from "@livekit/components-react"
import { Track } from "livekit-client"
import { VoiceVideoFrame } from "@/components/voice/VoiceVideoFrame"

/** Self-view PiP — spec preview container + mirror on preview only. */
export function AgentLocalVideoPip() {
  const { localParticipant, isCameraEnabled } = useLocalParticipant()
  const pub = localParticipant.getTrackPublication(Track.Source.Camera)

  if (!isCameraEnabled || !pub?.track || pub.isMuted) return null

  return (
    <VoiceVideoFrame
      participant={localParticipant}
      publication={pub}
      badge="agent"
      variant="preview"
      mirror
    />
  )
}
