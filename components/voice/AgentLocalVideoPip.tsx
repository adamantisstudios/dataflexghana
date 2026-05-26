"use client"

import { VideoTrack, useLocalParticipant } from "@livekit/components-react"
import { Track } from "livekit-client"
import { usePortraitVideoLayout } from "@/hooks/use-portrait-video-layout"
import { useVoiceDeviceLayout } from "@/lib/voice-video-utils"
import { cn } from "@/lib/utils"

/** Small PiP above the agent control bar. */
export function AgentLocalVideoPip() {
  const { localParticipant, isCameraEnabled } = useLocalParticipant()
  const { isMobile } = useVoiceDeviceLayout()
  const { containerRef, landscapeFeed } = usePortraitVideoLayout(isMobile)
  const pub = localParticipant.getTrackPublication(Track.Source.Camera)

  if (!isCameraEnabled || !pub?.track || pub.isMuted) return null

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed z-30 rounded-lg overflow-hidden border-2 border-[#0E8F3D]/60 shadow-xl bg-black",
        isMobile && "voice-video-portrait voice-video-frame",
        isMobile && landscapeFeed && "voice-video-landscape-feed",
        isMobile
          ? "bottom-[4.5rem] right-3 w-24 aspect-[9/16] max-w-[420px]"
          : "bottom-20 right-4 w-36 aspect-video",
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
