"use client"

import { VideoTrack, useLocalParticipant } from "@livekit/components-react"
import { Track } from "livekit-client"
import { useVoiceDeviceLayout, voiceVideoAspectClass } from "@/lib/voice-video-utils"
import { cn } from "@/lib/utils"

/** Small self-preview when admin camera is on. */
export function AdminLocalVideoPreview() {
  const { localParticipant, isCameraEnabled } = useLocalParticipant()
  const { isMobile } = useVoiceDeviceLayout()
  const pub = localParticipant.getTrackPublication(Track.Source.Camera)

  if (!isCameraEnabled || !pub?.track || pub.isMuted) return null

  return (
    <div
      className={cn(
        "absolute z-20 rounded-lg overflow-hidden border-2 border-[#0E8F3D]/50 shadow-lg bg-black",
        voiceVideoAspectClass(isMobile),
        isMobile ? "bottom-24 right-2 w-24" : "bottom-4 right-4 w-40",
      )}
    >
      <VideoTrack
        trackRef={{
          participant: localParticipant,
          publication: pub,
          source: Track.Source.Camera,
        }}
        className="w-full h-full object-contain bg-black"
        style={{ transform: "scaleX(-1)" }}
      />
    </div>
  )
}
