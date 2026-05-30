"use client"

import { useEffect, useRef, useState } from "react"
import { VideoTrack } from "@livekit/components-react"
import { Track, type Participant, type TrackPublication } from "livekit-client"
import { Headphones, Maximize, Minimize, Monitor, Shield, User, Video } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type VoiceVideoBadge = "admin" | "agent" | "host" | "speaker" | "screen" | "user"

export type VoiceVideoVariant = "main" | "preview" | "chip"

type Props = {
  participant: Participant
  publication: TrackPublication
  variant?: VoiceVideoVariant
  className?: string
  label?: string
  badge?: VoiceVideoBadge
  mirror?: boolean
  enableFullscreen?: boolean
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

/** LiveKit video surface — layout only via variant CSS (9:16 contain, no rotation). */
export function VoiceVideoFrame({
  participant,
  publication,
  variant = "main",
  className,
  label,
  badge,
  mirror = false,
  enableFullscreen = false,
}: Props) {
  const isScreen = badge === "screen"
  const frameRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [subscriptionFailed, setSubscriptionFailed] = useState(false)
  const failTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(document.fullscreenElement === frameRef.current)
    }
    document.addEventListener("fullscreenchange", onFsChange)
    return () => document.removeEventListener("fullscreenchange", onFsChange)
  }, [])

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

  const toggleFullscreen = async () => {
    const el = frameRef.current
    if (!el) return
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen()
      } else if (el.requestFullscreen) {
        await el.requestFullscreen()
      }
    } catch {
      /* ignore */
    }
  }

  const badgeKey = badge ?? (label ? "user" : undefined)
  const badgeMeta = badgeKey ? BADGE_CONFIG[badgeKey] : null
  const BadgeIcon = badgeMeta?.icon

  const containerClass =
    variant === "preview"
      ? cn("preview-video-container", mirror && "preview-video-container--mirror")
      : variant === "chip"
        ? "voip-chip-video w-full h-full"
        : cn("main-video-container main-video-container--fullscreen", className)

  const trackClass =
    variant === "preview" ? "preview-video" : variant === "chip" ? "w-full h-full" : "main-video main-video-inner"

  return (
    <div ref={frameRef} className={cn(containerClass, variant !== "main" && className)}>
      <VideoTrack
        trackRef={{
          participant,
          publication,
          source: isScreen ? Track.Source.ScreenShare : Track.Source.Camera,
        }}
        className={cn(
          trackClass,
          "bg-black",
          variant === "main" && "!object-contain",
        )}
        style={variant === "main" ? { objectFit: "contain" } : undefined}
      />

      {variant === "main" && badgeMeta && BadgeIcon && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute top-3 left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 border border-white/15 shrink-0"
                aria-label={badgeMeta.tooltip}
              >
                <BadgeIcon className="h-4 w-4 text-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {badgeMeta.tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {variant === "main" && !badgeMeta && label && (
        <div className="absolute top-3 left-3 z-10 max-w-[calc(100%-1rem)] px-2 py-0.5 rounded bg-black/50 text-[10px] text-white truncate">
          {label}
        </div>
      )}

      {enableFullscreen && variant === "main" && (
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="absolute bottom-20 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(10,15,25,0.75)] text-white border border-white/15 hover:bg-[rgba(21,32,43,0.9)]"
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      )}

      {subscriptionFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/85 text-white/60 text-xs px-4 text-center z-30">
          Video unavailable
        </div>
      )}
    </div>
  )
}
