"use client"

import { VideoTrack, useLocalParticipant } from "@livekit/components-react"
import { Track } from "livekit-client"

/** Small self-preview when admin camera is on. */
export function AdminLocalVideoPreview() {
  const { localParticipant, isCameraEnabled } = useLocalParticipant()
  const pub = localParticipant.getTrackPublication(Track.Source.Camera)

  if (!isCameraEnabled || !pub?.track || pub.isMuted) return null

  return (
    <div className="absolute bottom-20 right-2 z-20 w-28 aspect-video rounded-lg overflow-hidden border-2 border-emerald-500/50 shadow-lg bg-black">
      <VideoTrack
        trackRef={{
          participant: localParticipant,
          publication: pub,
          source: Track.Source.Camera,
        }}
        className="w-full h-full object-cover mirror"
        style={{ transform: "scaleX(-1)" }}
      />
    </div>
  )
}
