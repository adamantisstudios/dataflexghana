"use client"

import { useEffect, useRef, useState } from "react"
import { VideoTrack } from "@livekit/components-react"
import { Track, type Participant, type TrackPublication } from "livekit-client"
import { Headphones, Maximize, Minimize, Monitor, Shield, User, Video } from "lucide-react"
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
  label?: string
  badge?: VoiceVideoBadge
  mirror?: boolean
  maxWidthClass?: string
  compact?: boolean
  enableFullscreen?: boolean
  enablePinchZoom?: boolean
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

function readDimensions(
  publication: TrackPublication,
): { width: number; height: number } | null {
  const pubDims = (publication as { dimensions?: { width?: number; height?: number } }).dimensions
  const trackDims = (publication.track as { dimensions?: { width?: number; height?: number } } | null)
    ?.dimensions
  const raw = pubDims ?? trackDims
  if (!raw) return null
  const width = Number(raw.width ?? 0)
  const height = Number(raw.height ?? 0)
  if (width <= 0 || height <= 0) return null
  return { width, height }
}

/** Unified 9:16 live video — portrait container, cover fit; landscape feeds use fixed CSS rotate. */
export function VoiceVideoFrame({
  participant,
  publication,
  className,
  label,
  badge,
  mirror = false,
  maxWidthClass = "max-w-3xl",
  compact = false,
  enableFullscreen = false,
  enablePinchZoom = false,
}: Props) {
  const { objectFitClass, isMobile } = useVoiceDeviceLayout()
  const portraitLayout = badge !== "screen"
  const dims = readDimensions(publication)
  const isLandscapeFeed = Boolean(portraitLayout && dims && dims.width > dims.height)

  const frameRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
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

  return (
    <div
      ref={frameRef}
      className={cn(
        "relative w-full mx-auto rounded-xl overflow-hidden bg-black voice-video-frame",
        portraitLayout && "voice-video-portrait",
        portraitLayout && isLandscapeFeed && "voice-video-landscape-feed",
        portraitLayout && mirror && "voice-video-mirror",
        portraitLayout
          ? compact
            ? "aspect-[9/16] max-w-none"
            : "aspect-[9/16] max-h-[min(85dvh,720px)] max-w-[min(100%,420px)]"
          : isMobile
            ? "aspect-[9/16] max-h-[min(85dvh,720px)]"
            : `aspect-video max-h-[min(70vh,720px)] ${maxWidthClass}`,
        compact && "max-w-none",
        className,
      )}
    >
      <div ref={innerRef} className="voice-video-inner absolute inset-0 overflow-hidden">
        <VideoTrack
          trackRef={{
            participant,
            publication,
            source: Track.Source.Camera,
          }}
          className={cn(
            "voice-video-track w-full h-full bg-black",
            portraitLayout ? "voice-video-track-portrait" : objectFitClass,
          )}
        />
      </div>

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

      {enableFullscreen && portraitLayout && (
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="absolute bottom-2 right-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white border border-white/20 hover:bg-black/80"
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      )}

      {subscriptionFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-[#9aa0a6] text-xs px-4 text-center z-30">
          Video unavailable
        </div>
      )}
    </div>
  )
}
