"use client"

import { VideoTrack, useLocalParticipant } from "@livekit/components-react"
import { Track } from "livekit-client"
import { VoiceVideoFrame } from "@/components/voice/VoiceVideoFrame"
import { useVoiceDeviceLayout } from "@/lib/voice-video-utils"
import { cn } from "@/lib/utils"

/** Small self-preview when admin camera is on — same framing as main stage. */
export function AdminLocalVideoPreview() {
  const { localParticipant, isCameraEnabled } = useLocalParticipant()
  const { isMobile } = useVoiceDeviceLayout()
  const pub = localParticipant.getTrackPublication(Track.Source.Camera)

  if (!isCameraEnabled || !pub?.track || pub.isMuted) return null

  if (isMobile) {
    return (
      <div
        className={cn(
          "absolute z-20 bottom-24 right-2 w-[108px] rounded-lg overflow-hidden",
          "border-2 border-[#0E8F3D]/50 shadow-lg",
        )}
      >
        <VoiceVideoFrame
          participant={localParticipant}
          publication={pub}
          badge="admin"
          mirror
          compact
          className="w-full rounded-lg"
        />
      </div>
    )
  }

  return (
    <div className="absolute z-20 bottom-4 right-4 w-40 rounded-lg overflow-hidden border-2 border-[#0E8F3D]/50 shadow-lg bg-black">
      <VideoTrack
        trackRef={{
          participant: localParticipant,
          publication: pub,
          source: Track.Source.Camera,
        }}
        className="w-full h-full aspect-video object-contain bg-black"
        style={{ transform: "scaleX(-1)" }}
      />
    </div>
  )
}
