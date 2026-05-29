"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { VideoTrack } from "@livekit/components-react"
import { Track, type Participant, type TrackPublication } from "livekit-client"
import { Headphones, Monitor, Shield, User, Video } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type VoiceVideoBadge = "admin" | "agent" | "host" | "speaker" | "screen" | "user"
export type VoiceVideoVariant = "main" | "preview" | "tile"

type Props = {
  participant: Participant
  publication: TrackPublication
  variant?: VoiceVideoVariant
  label?: string
  badge?: VoiceVideoBadge
  /** Self-view mirror — applied on preview/tile only per spec */
  mirror?: boolean
  className?: string
}

const BADGE_CONFIG: Record<VoiceVideoBadge, { icon: typeof Video; tooltip: string }> = {
  admin: { icon: Shield, tooltip: "Admin camera" },
  agent: { icon: Headphones, tooltip: "Agent camera" },
  host: { icon: Video, tooltip: "Host camera" },
  speaker: { icon: User, tooltip: "Speaker camera" },
  screen: { icon: Monitor, tooltip: "Screen share" },
  user: { icon: User, tooltip: "Participant camera" },
}

const MIN_ZOOM = 1
const MAX_ZOOM = 3

function LiveVideoZoomBar({
  zoom,
  onZoomChange,
  onReset,
}: {
  zoom: number
  onZoomChange: (value: number) => void
  onReset: () => void
}) {
  return (
    <div
      className="live-video-zoom-bar"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <label className="sr-only" htmlFor="live-video-zoom-range">
        Video zoom
      </label>
      <input
        id="live-video-zoom-range"
        type="range"
        min={MIN_ZOOM}
        max={MAX_ZOOM}
        step={0.05}
        value={zoom}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        className="live-video-zoom-range flex-1"
        aria-valuemin={MIN_ZOOM}
        aria-valuemax={MAX_ZOOM}
        aria-valuenow={zoom}
      />
      <span className="text-xs text-white tabular-nums shrink-0 w-9 text-center">{zoom.toFixed(1)}×</span>
      <button type="button" onClick={onReset} className="live-video-zoom-reset">
        Reset
      </button>
    </div>
  )
}

/** Live stream video — spec CSS only; zoom via scale(); mirror on preview self-view only. */
export function VoiceVideoFrame({
  participant,
  publication,
  variant = "main",
  label,
  badge,
  mirror = false,
  className,
}: Props) {
  const isScreen = badge === "screen"
  const trackSid = publication.trackSid
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [subscriptionFailed, setSubscriptionFailed] = useState(false)
  const failTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setZoom(1)
  }, [trackSid])

  useEffect(() => {
    setSubscriptionFailed(false)
    if (failTimerRef.current) clearTimeout(failTimerRef.current)
    if (publication.track && !publication.isMuted) return
    failTimerRef.current = setTimeout(() => {
      if (!publication.track || publication.isMuted) setSubscriptionFailed(true)
    }, 5000)
    return () => {
      if (failTimerRef.current) clearTimeout(failTimerRef.current)
    }
  }, [publication.track, publication.isMuted, publication.trackSid])

  const applyVideoZoom = useCallback(() => {
    if (isScreen) return
    const video = containerRef.current?.querySelector("video")
    if (!(video instanceof HTMLVideoElement)) return

    const useMirror = mirror && (variant === "preview" || variant === "tile")
    if (useMirror && zoom !== 1) {
      video.style.transform = `scaleX(-1) scale(${zoom})`
    } else if (useMirror) {
      video.style.transform = "scaleX(-1)"
    } else if (zoom !== 1) {
      video.style.transform = `scale(${zoom})`
    } else {
      video.style.removeProperty("transform")
    }
  }, [isScreen, mirror, variant, zoom])

  useEffect(() => {
    applyVideoZoom()
    const root = containerRef.current
    if (!root) return
    const observer = new MutationObserver(() => applyVideoZoom())
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [applyVideoZoom, trackSid])

  const resetZoom = useCallback(() => setZoom(1), [])

  const badgeKey = badge ?? (label ? "user" : undefined)
  const badgeMeta = badgeKey ? BADGE_CONFIG[badgeKey] : null
  const BadgeIcon = badgeMeta?.icon

  if (isScreen) {
    return (
      <div className={cn("relative w-full aspect-video max-h-[70vh] overflow-hidden bg-black", className)}>
        <VideoTrack
          trackRef={{ participant, publication, source: Track.Source.Camera }}
          className="w-full h-full object-contain"
        />
      </div>
    )
  }

  const containerClass =
    variant === "preview"
      ? "preview-video-container"
      : variant === "tile"
        ? "preview-video-container preview-video-container--tile"
        : "main-video-container"

  const videoClass = variant === "main" ? "main-video" : "preview-video"

  return (
    <div ref={containerRef} className={cn(containerClass, className)}>
      <VideoTrack
        trackRef={{ participant, publication, source: Track.Source.Camera }}
        className={videoClass}
      />

      <LiveVideoZoomBar zoom={zoom} onZoomChange={setZoom} onReset={resetZoom} />

      {badgeMeta && BadgeIcon && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute top-2 left-2 z-[1100] flex h-7 w-7 items-center justify-center rounded-full bg-black/70 border border-white/20"
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
        <div className="absolute top-2 left-2 z-[1100] max-w-[calc(100%-1rem)] truncate rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
          {label}
        </div>
      )}

      {subscriptionFailed && (
        <div className="absolute inset-0 z-[1050] flex items-center justify-center bg-black/80 px-4 text-center text-xs text-[#9aa0a6]">
          Video unavailable
        </div>
      )}
    </div>
  )
}
