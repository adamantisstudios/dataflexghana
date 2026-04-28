"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Play, Pause, X, AlertCircle } from 'lucide-react'

interface AudioMedia {
  id: string
  media_url: string
  file_name: string
  duration?: number
}

interface AudioPlayerWithWaveformProps {
  audio: AudioMedia
  onDelete?: (audioId: string) => void
}

export function AudioPlayerWithWaveform({ audio, onDelete }: AudioPlayerWithWaveformProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(audio.duration || 0)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (audio.media_url) {
      setIsLoading(true)
      setError(null)
    }
  }, [audio.media_url])

  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerY = height / 2

    ctx.fillStyle = "#f3f4f6"
    ctx.fillRect(0, 0, width, height)

    const barWidth = width / waveformData.length
    const maxValue = Math.max(...waveformData, 0.1)

    waveformData.forEach((value, index) => {
      const barHeight = (value / maxValue) * (height * 0.8)
      const x = index * barWidth
      const y = centerY - barHeight / 2

      ctx.fillStyle = "#3b82f6"
      ctx.fillRect(x + 1, y, barWidth - 2, barHeight)
    })

    if (duration > 0) {
      const progressX = (currentTime / duration) * width
      ctx.strokeStyle = "#ef4444"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(progressX, 0)
      ctx.lineTo(progressX, height)
      ctx.stroke()
    }
  }, [waveformData, currentTime, duration])

  const generateSimpleWaveform = (duration: number) => {
    const samples = 50
    const data = Array.from({ length: samples }, () => Math.random() * 0.7 + 0.3)
    setWaveformData(data)
  }

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch((error) => {
          console.error("[v0] Error playing audio:", error)
          setError("Failed to play audio")
        })
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const newDuration = audioRef.current.duration
      setDuration(newDuration)
      generateSimpleWaveform(newDuration)
      setError(null)
      setIsLoading(false)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audioElement = e.currentTarget
    const errorCode = audioElement.error?.code
    let errorMessage = "Failed to load audio file"

    switch (errorCode) {
      case 1:
        errorMessage = "Audio loading was aborted"
        break
      case 2:
        errorMessage = "Network error loading audio"
        break
      case 3:
        errorMessage = "Audio format not supported or corrupted"
        break
      case 4:
        errorMessage = "Audio format not supported by your browser"
        break
    }

    console.error("[v0] Audio element error:", {
      code: errorCode,
      message: audioElement.error?.message,
      userMessage: errorMessage,
      url: audio.media_url,
    })
    setError(errorMessage)
    setIsLoading(false)
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-2 sm:p-3 my-2 w-full shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="default"
          className="h-8 w-8 p-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 flex-shrink-0 text-white text-xs"
          onClick={handlePlayPause}
          disabled={isLoading || !!error}
        >
          {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </Button>

        <div className="flex-1 flex flex-col gap-1 min-w-0">
          {error ? (
            <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 p-1.5 rounded">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              <span className="truncate text-xs">{error}</span>
            </div>
          ) : (
            <>
              <canvas
                ref={canvasRef}
                width={300}
                height={24}
                className="w-full h-6 bg-gray-200 rounded cursor-pointer hover:bg-gray-300 transition-colors"
                onClick={(e) => {
                  if (audioRef.current && duration > 0) {
                    const rect = canvasRef.current!.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const percentage = x / rect.width
                    audioRef.current.currentTime = percentage * duration
                  }
                }}
              />
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </>
          )}
        </div>

        {onDelete && (
          <Button
            size="sm"
            variant="destructive"
            className="h-7 w-7 p-0 flex-shrink-0 bg-red-500 hover:bg-red-600 text-xs"
            onClick={() => onDelete(audio.id)}
            title="Delete audio"
          >
            <X className="h-2.5 w-2.5" />
          </Button>
        )}
      </div>

      <audio
        ref={audioRef}
        src={audio.media_url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleAudioError}
        preload="metadata"
      />

      <p className="text-xs text-gray-600 mt-1 truncate font-medium">{audio.file_name}</p>
    </div>
  )
}
