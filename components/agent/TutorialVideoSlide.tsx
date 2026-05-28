"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Player from "@vimeo/player"
import { Pause, Play, MessageCircle } from "lucide-react"
import { detectPlatformFromEmbed, prepareAgentFeedEmbed } from "@/lib/tutorial-embed"

export interface TutorialVideoItem {
  id: string
  title: string
  platform: string
  embed_code: string
}

interface TutorialVideoSlideProps {
  video: TutorialVideoItem
  isActive: boolean
  shouldMount: boolean
  soundEnabled: boolean
  onRegisterPlayer: (id: string, player: Player | null) => void
  onCommentClick?: () => void
  commentsOpen?: boolean
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function TutorialVideoSlide({
  video,
  isActive,
  shouldMount,
  soundEnabled,
  onRegisterPlayer,
  onCommentClick,
  commentsOpen = false,
}: TutorialVideoSlideProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [paused, setPaused] = useState(false)

  const preparedEmbed = useMemo(() => prepareAgentFeedEmbed(video.embed_code), [video.embed_code])
  const platform = video.platform || detectPlatformFromEmbed(video.embed_code) || "vimeo"
  const isVimeo = platform === "vimeo"

  useEffect(() => {
    if (!shouldMount || !containerRef.current || !preparedEmbed) return

    containerRef.current.innerHTML = preparedEmbed
    const iframe = containerRef.current.querySelector("iframe")
    if (!iframe || !isVimeo) {
      onRegisterPlayer(video.id, null)
      return
    }

    const player = new Player(iframe)
    playerRef.current = player
    onRegisterPlayer(video.id, player)

    player.on("timeupdate", (data) => {
      setProgress(data.seconds)
      setDuration(data.duration)
    })
    player.on("play", () => setPaused(false))
    player.on("pause", () => setPaused(true))

    if (isActive) {
      player.play().catch(() => {})
    }

    return () => {
      player.destroy().catch(() => {})
      playerRef.current = null
      onRegisterPlayer(video.id, null)
    }
  }, [shouldMount, preparedEmbed, video.id, isVimeo, onRegisterPlayer])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !isVimeo) return

    if (isActive) {
      player.play().catch(() => {})
      if (soundEnabled) {
        player.setMuted(false).catch(() => {})
        player.setVolume(1).catch(() => {})
      }
    } else {
      player.pause().catch(() => {})
    }
  }, [isActive, soundEnabled, isVimeo])

  const togglePlayPause = async () => {
    const player = playerRef.current
    if (!player || !soundEnabled) return
    try {
      const isPaused = await player.getPaused()
      if (isPaused) await player.play()
      else await player.pause()
    } catch {
      // ignore
    }
  }

  const handleSeek = async (event: React.MouseEvent<HTMLDivElement>) => {
    const player = playerRef.current
    if (!player || duration <= 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    try {
      await player.setCurrentTime(ratio * duration)
    } catch {
      // ignore
    }
  }

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <div className="relative h-full w-full bg-black">
      {onCommentClick && (
        <button
          type="button"
          onClick={onCommentClick}
          className="absolute right-4 bottom-28 z-30 flex flex-col items-center gap-1 text-white/90 hover:text-white transition-colors"
          aria-label="Comments"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
            <MessageCircle className="h-5 w-5" />
          </span>
          <span className="text-[10px] font-medium">Comments</span>
        </button>
      )}

      {shouldMount ? (
        <div
          ref={containerRef}
          className={`tutorial-embed absolute inset-0 [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full ${isVimeo ? "" : "tutorial-embed--youtube"}`}
        />
      ) : null}

      {isVimeo && shouldMount && (
        <button
          type="button"
          onClick={togglePlayPause}
          disabled={!soundEnabled}
          aria-label="Toggle play/pause"
          className="absolute inset-0 z-10 bg-transparent disabled:cursor-default"
        />
      )}

      {isVimeo && shouldMount && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-6 pt-20">
          <p className="mb-3 text-sm font-medium text-white">{video.title}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlayPause}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              aria-label={paused ? "Play" : "Pause"}
            >
              {paused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4" />}
            </button>
            <p className="w-10 shrink-0 text-xs tabular-nums text-white/80">{formatTime(progress)}</p>
            <div
              role="slider"
              aria-label="Seek"
              tabIndex={0}
              onClick={handleSeek}
              className="group h-1.5 min-w-0 flex-1 cursor-pointer rounded-full bg-white/25"
            >
              <div
                className="h-full rounded-full bg-white transition-all group-hover:bg-white/90"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="w-10 shrink-0 text-right text-xs tabular-nums text-white/80">{formatTime(duration)}</p>
          </div>
        </div>
      )}

      {!isVimeo && shouldMount && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-8 pt-16">
          <p className="text-sm font-medium text-white">{video.title}</p>
        </div>
      )}
    </div>
  )
}

