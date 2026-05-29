"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import { VideoTrack } from "@livekit/components-react"
import { Track, type Participant, type TrackPublication } from "livekit-client"
import { Headphones, Maximize, Minimize, Monitor, RotateCcw, Shield, User, Video } from "lucide-react"
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
  compact?: boolean
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

const MIN_ZOOM = 1
const MAX_ZOOM = 3

/** One-time landscape detection from the actual &lt;video&gt; element (loadedmetadata only). */
function useVideoSourceLandscape(
  innerRef: RefObject<HTMLDivElement | null>,
  trackSid: string | undefined,
): boolean {
  const [isLandscape, setIsLandscape] = useState(false)
  const detectedForSid = useRef<string | null>(null)

  useEffect(() => {
    setIsLandscape(false)
    detectedForSid.current = null

    const root = innerRef.current
    if (!root || !trackSid) return

    const detectOnce = (video: HTMLVideoElement) => {
      if (detectedForSid.current === trackSid) return

      const apply = () => {
        if (detectedForSid.current === trackSid) return
        if (video.videoWidth <= 0 || video.videoHeight <= 0) return
        detectedForSid.current = trackSid
        setIsLandscape(video.videoWidth > video.videoHeight)
      }

      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        apply()
        return
      }

      video.addEventListener("loadedmetadata", apply, { once: true })
    }

    const existing = root.querySelector("video")
    if (existing instanceof HTMLVideoElement) {
      detectOnce(existing)
    }

    const observer = new MutationObserver(() => {
      const video = root.querySelector("video")
      if (video instanceof HTMLVideoElement) detectOnce(video)
    })
    observer.observe(root, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [innerRef, trackSid])

  return isLandscape
}

function VideoZoomControls({
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
      className="voice-video-zoom-controls absolute inset-x-0 bottom-0 z-40 flex items-center gap-2 px-3 py-2 bg-gradient-to-t from-black/85 to-transparent opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto [@media(hover:none)]:opacity-100 [@media(hover:none)]:pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <label className="sr-only" htmlFor="voice-video-zoom-range">
        Video zoom
      </label>
      <input
        id="voice-video-zoom-range"
        type="range"
        min={MIN_ZOOM}
        max={MAX_ZOOM}
        step={0.05}
        value={zoom}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        className="voice-video-zoom-slider flex-1 min-h-[44px] h-11 cursor-pointer accent-[#0E8F3D]"
        aria-valuemin={MIN_ZOOM}
        aria-valuemax={MAX_ZOOM}
        aria-valuenow={zoom}
      />
      <span className="text-[10px] text-white/80 tabular-nums w-8 text-center shrink-0">
        {zoom.toFixed(1)}×
      </span>
      <button
        type="button"
        onClick={onReset}
        className="flex h-11 min-h-[44px] min-w-[44px] w-11 items-center justify-center rounded-full bg-black/70 border border-white/25 text-white hover:bg-black/90 shrink-0"
        aria-label="Reset zoom"
        title="Reset zoom"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    </div>
  )
}

/** Forced 9:16 vertical live video — portrait capture, one-time landscape rotate, manual zoom. */
export function VoiceVideoFrame({
  participant,
  publication,
  className,
  label,
  badge,
  mirror = false,
  compact = false,
  enableFullscreen = false,
}: Props) {
  const portraitLayout = badge !== "screen"
  const trackSid = publication.trackSid

  const frameRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [subscriptionFailed, setSubscriptionFailed] = useState(false)
  const [zoom, setZoom] = useState(1)
  const failTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isLandscapeSource = useVideoSourceLandscape(innerRef, trackSid)

  useEffect(() => {
    setZoom(1)
  }, [trackSid])

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

  const resetZoom = useCallback(() => setZoom(1), [])

  const applyVideoTransform = useCallback(() => {
    if (!portraitLayout) return
    const video = innerRef.current?.querySelector("video")
    if (!(video instanceof HTMLVideoElement)) return

    const set = (prop: string, value: string) => {
      video.style.setProperty(prop, value, "important")
    }

    if (isLandscapeSource) {
      set("position", "absolute")
      set("top", "50%")
      set("left", "50%")
      set("width", "177.8%")
      set("height", "56.25%")
      set("object-fit", "cover")
      let transform = "translate(-50%, -50%) rotate(90deg)"
      if (mirror) transform += " scaleX(-1)"
      if (zoom !== 1) transform += ` scale(${zoom})`
      set("transform", transform)
      return
    }

    set("position", "relative")
    set("top", "auto")
    set("left", "auto")
    set("width", "100%")
    set("height", "100%")
    set("object-fit", "cover")

    if (mirror && zoom !== 1) {
      set("transform", `scaleX(-1) scale(${zoom})`)
    } else if (mirror) {
      set("transform", "scaleX(-1)")
    } else if (zoom !== 1) {
      set("transform", `scale(${zoom})`)
    } else {
      video.style.removeProperty("transform")
    }
  }, [portraitLayout, isLandscapeSource, mirror, zoom])

  useEffect(() => {
    applyVideoTransform()
    const root = innerRef.current
    if (!root) return
    const observer = new MutationObserver(() => applyVideoTransform())
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [applyVideoTransform, trackSid])

  const badgeKey = badge ?? (label ? "user" : undefined)
  const badgeMeta = badgeKey ? BADGE_CONFIG[badgeKey] : null
  const BadgeIcon = badgeMeta?.icon

  const portraitFrameClass = cn(
    "voice-video-portrait group",
    isLandscapeSource && "voice-video-source-landscape",
    mirror && "voice-video-mirror",
    compact && "voice-video-portrait-compact",
  )

  return (
    <div
      ref={frameRef}
      className={cn(
        "relative mx-auto rounded-xl bg-black voice-video-frame",
        portraitLayout ? portraitFrameClass : "aspect-video w-full max-h-[min(70vh,720px)] overflow-hidden",
        className,
      )}
      style={
        portraitLayout
          ? {
              aspectRatio: "9 / 16",
              maxWidth: compact ? undefined : 420,
              width: "100%",
              position: "relative",
              overflow: "hidden",
            }
          : undefined
      }
    >
      <div ref={innerRef} className="voice-video-inner absolute inset-0 overflow-hidden">
        <VideoTrack
          trackRef={{
            participant,
            publication,
            source: Track.Source.Camera,
          }}
          className={cn(
            "voice-video-track bg-black",
            portraitLayout ? "voice-video-track-portrait" : "w-full h-full object-contain",
          )}
        />
      </div>

      {portraitLayout && (
        <VideoZoomControls
          zoom={zoom}
          onZoomChange={setZoom}
          onReset={resetZoom}
        />
      )}

      {badgeMeta && BadgeIcon && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute top-2 left-2 z-30 flex items-center justify-center h-7 w-7 rounded-full bg-black/70 border border-white/20 shrink-0"
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
        <div className="absolute top-2 left-2 z-30 max-w-[calc(100%-1rem)] px-2 py-0.5 rounded bg-black/60 text-[10px] text-white truncate">
          {label}
        </div>
      )}

      {enableFullscreen && portraitLayout && (
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="absolute top-2 right-2 z-30 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/65 text-white border border-white/20 hover:bg-black/80"
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      )}

      {subscriptionFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-[#9aa0a6] text-xs px-4 text-center z-50">
          Video unavailable
        </div>
      )}
    </div>
  )
}
