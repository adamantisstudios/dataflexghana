"use client"

import { useEffect, useRef, useState } from "react"
import { VideoTrack } from "@livekit/components-react"
import { Track, type Participant, type TrackPublication } from "livekit-client"
import { Headphones, Monitor, Shield, User, Video } from "lucide-react"
import { useVoiceDeviceLayout } from "@/lib/voice-video-utils"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type VoiceVideoBadge = "admin" | "agent" | "host" | "speaker" | "screen" | "user"

type Props = {
  participant: Participant
  publication: TrackPublication
  className?: string
  /** @deprecated Prefer `badge` — short text fallback only when no badge */
  label?: string
  badge?: VoiceVideoBadge
  mirror?: boolean
  maxWidthClass?: string
}

const BADGE_CONFIG: Record<
  VoiceVideoBadge,
  { icon: typeof Video; tooltip: string }
> = {
  admin: { icon: Shield, tooltip: "Admin camera" },
  agent: { icon: Headphones, tooltip: "Agent camera" },
  host: { icon: Video, tooltip: "Host camera" },
  speaker: { icon: User, tooltip: "Speaker camera" },
  screen: { icon: Monitor, tooltip: "Screen share" },
  user: { icon: User, tooltip: "Participant camera" },
}

/** Video tile with device-appropriate aspect ratio (9:16 phone, 16:9 desktop). */
export function VoiceVideoFrame({
  participant,
  publication,
  className,
  label,
  badge,
  mirror = false,
  maxWidthClass = "max-w-3xl",
}: Props) {
  const { aspectClass } = useVoiceDeviceLayout()
  const [subscriptionFailed, setSubscriptionFailed] = useState(false)
  const failTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSubscriptionFailed(false)
    if (failTimerRef.current) clearTimeout(failTimerRef.current)

    if (publication.track && !publication.isMuted) return

    failTimerRef.current = setTimeout(() => {
      if (!publication.track || publication.isMuted) {
        setSubscriptionFailed(true)
      }
    }, 5000)

    return () => {
      if (failTimerRef.current) clearTimeout(failTimerRef.current)
    }
  }, [publication.track, publication.isMuted, publication.trackSid])

  const badgeKey = badge ?? (label ? "user" : undefined)
  const badgeMeta = badgeKey ? BADGE_CONFIG[badgeKey] : null
  const BadgeIcon = badgeMeta?.icon

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
        className="w-full h-full object-contain bg-black"
        style={mirror ? { transform: "scaleX(-1)" } : undefined}
      />
      {badgeMeta && BadgeIcon && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute top-2 left-2 z-10 flex items-center justify-center h-7 w-7 rounded-full bg-black/70 border border-white/20 shrink-0"
                aria-label={badgeMeta.tooltip}
              >
                <BadgeIcon className="h-3.5 w-3.5 text-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {badgeMeta.tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {!badgeMeta && label && (
        <div className="absolute top-2 left-2 z-10 max-w-[calc(100%-1rem)] px-2 py-0.5 rounded bg-black/60 text-[10px] text-white truncate">
          {label}
        </div>
      )}
      {subscriptionFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-[#9aa0a6] text-xs px-4 text-center">
          Video unavailable
        </div>
      )}
    </div>
  )
}
