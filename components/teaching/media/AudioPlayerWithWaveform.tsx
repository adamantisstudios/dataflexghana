"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Play, Pause, X } from "lucide-react"

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
    const generateWaveform = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(audio.media_url, {
          method: "GET",
          headers: {
            Accept: "audio/*",
          },
          mode: "cors",
        })

        if (!response.ok) {
          console.error("[v0] Audio fetch failed:", response.status, response.statusText)
          setIsLoading(false)
          return
        }

        const contentType = response.headers.get("content-type")
        console.log("[v0] Audio content type:", contentType)

        const arrayBuffer = await response.arrayBuffer()
        if (arrayBuffer.byteLength === 0) {
          console.warn("[v0] Audio file is empty")
          setIsLoading(false)
          return
        }

        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

          // Sample the audio data to create waveform
          const rawData = audioBuffer.getChannelData(0)
          const samples = 100
          const blockSize = Math.floor(rawData.length / samples)
          const filteredData: number[] = []

          for (let i = 0; i < samples; i++) {
            let sum = 0
            for (let j = 0; j < blockSize; j++) {
              sum += Math.abs(rawData[i * blockSize + j])
            }
            filteredData.push(sum / blockSize)
          }

          setWaveformData(filteredData)
          setDuration(audioBuffer.duration)
          setError(null)
        } catch (decodeError) {
          console.warn("[v0] Audio decode error (waveform will be skipped):", decodeError)
          setWaveformData([])
        }
      } catch (error) {
        console.error("[v0] Error generating waveform:", error)
        setWaveformData([])
      } finally {
        setIsLoading(false)
      }
    }

    if (audio.media_url) {
      generateWaveform()
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
      setDuration(audioRef.current.duration)
      setError(null)
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
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-3 w-full">
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="default"
          className="h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700 flex-shrink-0"
          onClick={handlePlayPause}
          disabled={isLoading || !!error}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <div className="flex-1 flex flex-col gap-2 min-w-0">
          {error ? (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>
          ) : (
            <>
              <canvas
                ref={canvasRef}
                width={300}
                height={40}
                className="w-full h-10 bg-gray-100 rounded cursor-pointer"
                onClick={(e) => {
                  if (audioRef.current && duration > 0) {
                    const rect = canvasRef.current!.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const percentage = x / rect.width
                    audioRef.current.currentTime = percentage * duration
                  }
                }}
              />
              <div className="flex justify-between text-xs text-gray-600">
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
            className="h-8 w-8 p-0 flex-shrink-0"
            onClick={() => onDelete(audio.id)}
          >
            <X className="h-3 w-3" />
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
        crossOrigin="anonymous"
        preload="metadata"
      />

      <p className="text-xs text-gray-600 mt-2 truncate">{audio.file_name}</p>
    </div>
  )
}
