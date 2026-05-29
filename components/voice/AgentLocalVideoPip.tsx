"use client"

import { useLocalParticipant } from "@livekit/components-react"
import { Track } from "livekit-client"
import { VoiceVideoFrame } from "@/components/voice/VoiceVideoFrame"
import { cn } from "@/lib/utils"

const PIP_SHELL =
  "fixed z-40 overflow-hidden rounded-xl border-2 border-[#0E8F3D]/60 bg-black shadow-xl aspect-[9/16] w-24 sm:w-60 sm:max-w-[240px]"

/** PiP self-view above the agent control bar — same 9:16 portrait CSS as host stream. */
export function AgentLocalVideoPip() {
  const { localParticipant, isCameraEnabled } = useLocalParticipant()
  const pub = localParticipant.getTrackPublication(Track.Source.Camera)

  if (!isCameraEnabled || !pub?.track || pub.isMuted) return null

  return (
    <div
      className={cn(
        PIP_SHELL,
        "bottom-[max(4.5rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))]",
        "sm:bottom-20 sm:right-4",
      )}
    >
      <VoiceVideoFrame
        participant={localParticipant}
        publication={pub}
        badge="agent"
        mirror
        compact
        maxWidthClass="max-w-none"
        className="h-full w-full rounded-xl"
      />
    </div>
  )
}
