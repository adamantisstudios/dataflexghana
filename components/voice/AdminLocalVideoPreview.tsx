"use client"

import { VideoTrack, useLocalParticipant } from "@livekit/components-react"
import { Track } from "livekit-client"
import { usePortraitVideoLayout } from "@/hooks/use-portrait-video-layout"
import { useVoiceDeviceLayout, voiceVideoAspectClass } from "@/lib/voice-video-utils"
import { cn } from "@/lib/utils"

/** Small self-preview when admin camera is on. */
export function AdminLocalVideoPreview() {
  const { localParticipant, isCameraEnabled } = useLocalParticipant()
  const { isMobile } = useVoiceDeviceLayout()
  const { containerRef, landscapeFeed } = usePortraitVideoLayout(isMobile)
  const pub = localParticipant.getTrackPublication(Track.Source.Camera)

  if (!isCameraEnabled || !pub?.track || pub.isMuted) return null

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute z-20 rounded-lg overflow-hidden border-2 border-[#0E8F3D]/50 shadow-lg bg-black",
        voiceVideoAspectClass(isMobile),
        isMobile && "voice-video-portrait",
        isMobile && landscapeFeed && "voice-video-landscape-feed",
        isMobile ? "bottom-24 right-2 w-24" : "bottom-4 right-4 w-40",
      )}
    >
      <VideoTrack
        trackRef={{
          participant: localParticipant,
          publication: pub,
          source: Track.Source.Camera,
        }}
        className={cn(
          "w-full h-full bg-black voice-video-track",
          isMobile ? "voice-video-track-portrait" : "object-contain object-center",
        )}
        style={{ transform: "scaleX(-1)" }}
      />
    </div>
  )
}
