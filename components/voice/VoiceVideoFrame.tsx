"use client"

import { VideoTrack } from "@livekit/components-react"
import { Track, type Participant, type TrackPublication } from "livekit-client"
import { useVoiceDeviceLayout } from "@/lib/voice-video-utils"
import { cn } from "@/lib/utils"

type Props = {
  participant: Participant
  publication: TrackPublication
  className?: string
  label?: string
  mirror?: boolean
  maxWidthClass?: string
}

/** Video tile with device-appropriate aspect ratio (9:16 phone, 16:9 desktop). */
export function VoiceVideoFrame({
  participant,
  publication,
  className,
  label,
  mirror = false,
  maxWidthClass = "max-w-3xl",
}: Props) {
  const { aspectClass } = useVoiceDeviceLayout()

  return (
    <div
      className={cn(
        "relative w-full mx-auto rounded-xl overflow-hidden bg-black",
        aspectClass,
        maxWidthClass,
        className,
      )}
    >
      <VideoTrack
        trackRef={{
          participant,
          publication,
          source: Track.Source.Camera,
        }}
        className="w-full h-full object-cover"
        style={mirror ? { transform: "scaleX(-1)" } : undefined}
      />
      {label && (
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-xs text-white truncate max-w-[80%]">
          {label}
        </div>
      )}
    </div>
  )
}
