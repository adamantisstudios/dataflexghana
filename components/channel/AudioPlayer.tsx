"use client"

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { Pause, Play, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatTimestamp } from "@/lib/channel-audio-types"
import { normalizeMediaUrl } from "@/components/teaching/teaching-hub-ui"

export type AudioPlayerHandle = {
  getCurrentTime: () => number
  seekTo: (seconds: number) => void
  play: () => void
  pause: () => void
}

type Props = {
  src: string
  title?: string
  className?: string
  sticky?: boolean
  onTimeUpdate?: (seconds: number) => void
  onDurationChange?: (seconds: number) => void
}

export const AudioPlayer = forwardRef<AudioPlayerHandle, Props>(function AudioPlayer(
  { src, title, className, sticky = false, onTimeUpdate, onDurationChange },
  ref,
) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [rate, setRate] = useState(1)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => audioRef.current?.currentTime ?? 0,
    seekTo: (seconds: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(0, seconds)
        setCurrent(seconds)
      }
    },
    play: () => void audioRef.current?.play(),
    pause: () => audioRef.current?.pause(),
  }))

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.pause()
    setPlaying(false)
    setCurrent(0)
    setDuration(0)
    setLoadError(null)
  }, [resolvedSrc])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate
  }, [rate])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume
    }
  }, [volume, muted])

  const togglePlay = () => {
    const el = audioRef.current
    if (!el || !resolvedSrc) return
    if (playing) {
      el.pause()
    } else {
      void el.play().catch(() => {
        setLoadError("Unable to play this audio. Check your connection or contact the channel admin.")
      })
    }
  }

  const cycleRate = () => {
    const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1
    setRate(next)
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white shadow-lg p-3 sm:p-4",
        sticky && "fixed bottom-0 left-0 right-0 z-40 rounded-none border-x-0 border-b-0",
        className,
      )}
    >
      <audio
        ref={audioRef}
        src={resolvedSrc || undefined}
        preload="metadata"
        playsInline
        onPlay={() => {
          setLoadError(null)
          setPlaying(true)
        }}
        onPause={() => setPlaying(false)}
        onError={() => {
          setLoadError("Audio file could not be loaded.")
          setPlaying(false)
        }}
        onTimeUpdate={() => {
          const t = audioRef.current?.currentTime ?? 0
          setCurrent(t)
          onTimeUpdate?.(t)
        }}
        onLoadedMetadata={() => {
          const d = audioRef.current?.duration ?? 0
          setDuration(Number.isFinite(d) ? d : 0)
          onDurationChange?.(Number.isFinite(d) ? d : 0)
          setLoadError(null)
        }}
        onEnded={() => setPlaying(false)}
      />

      {loadError && (
        <p className="mb-2 text-xs text-red-600" role="alert">
          {loadError}
        </p>
      )}
      {!resolvedSrc && (
        <p className="mb-2 text-xs text-amber-700">No audio URL available for this lecture.</p>
      )}

      {title && (
        <p className="text-xs font-medium text-gray-900 truncate mb-2 sm:text-sm">{title}</p>
      )}

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={current}
        onChange={(e) => {
          const t = parseFloat(e.target.value)
          if (audioRef.current) audioRef.current.currentTime = t
          setCurrent(t)
        }}
        className="w-full h-2 mb-2 accent-green-600 cursor-pointer min-h-[44px] sm:min-h-0"
        aria-label="Seek"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
          <span className="text-xs text-gray-600 tabular-nums whitespace-nowrap">
            {formatTimestamp(current)} / {formatTimestamp(duration)}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={cycleRate}
            className="h-11 min-w-[44px] px-2 text-xs font-semibold text-gray-800 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            {rate}x
          </button>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => {
              setMuted(false)
              setVolume(parseFloat(e.target.value))
            }}
            className="w-16 sm:w-20 accent-green-600 hidden sm:block"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  )
})
