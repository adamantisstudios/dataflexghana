"use client"

import { useLocalParticipant } from "@livekit/components-react"
import { Track } from "livekit-client"
import { VoiceVideoFrame } from "@/components/voice/VoiceVideoFrame"
import { useVoiceDeviceLayout } from "@/lib/voice-video-utils"
import { cn } from "@/lib/utils"

/** Small PiP above the agent control bar — same portrait CSS as host stream. */
export function AgentLocalVideoPip() {
  const { localParticipant, isCameraEnabled } = useLocalParticipant()
  const { isMobile } = useVoiceDeviceLayout()
  const pub = localParticipant.getTrackPublication(Track.Source.Camera)

  if (!isCameraEnabled || !pub?.track || pub.isMuted) return null

  if (!isMobile) {
    return (
      <div className="fixed z-30 bottom-20 right-4 w-36 aspect-video rounded-lg overflow-hidden border-2 border-[#0E8F3D]/60 shadow-xl bg-black">
        <VoiceVideoFrame
          participant={localParticipant}
          publication={pub}
          badge="agent"
          mirror
          compact
          maxWidthClass="max-w-none"
          className="w-full h-full"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "fixed z-30 bottom-[4.5rem] right-3 w-[108px] rounded-lg overflow-hidden",
        "border-2 border-[#0E8F3D]/60 shadow-xl",
      )}
    >
      <VoiceVideoFrame
        participant={localParticipant}
        publication={pub}
        badge="agent"
        mirror
        compact
        className="w-full"
      />
    </div>
  )
}
