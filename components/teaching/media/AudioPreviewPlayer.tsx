"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, X } from "lucide-react"

interface AudioPreviewPlayerProps {
  audioBlob: Blob
  onClear?: () => void
}

export function AudioPreviewPlayer({ audioBlob, onClear }: AudioPreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const generateWaveform = async () => {
      try {
        const arrayBuffer = await audioBlob.arrayBuffer()
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

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
      } catch (error) {
        console.error("[v0] Error generating preview waveform:", error)
      }
    }

    generateWaveform()
  }, [audioBlob])

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

      ctx.fillStyle = "#10b981"
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
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full">
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="default"
          className="h-10 w-10 p-0 bg-green-600 hover:bg-green-700 flex-shrink-0"
          onClick={handlePlayPause}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <div className="flex-1 flex flex-col gap-2 min-w-0">
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
        </div>

        {onClear && (
          <Button size="sm" variant="destructive" className="h-8 w-8 p-0 flex-shrink-0" onClick={onClear}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <audio
        ref={audioRef}
        src={URL.createObjectURL(audioBlob)}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
        }}
        onEnded={() => setIsPlaying(false)}
        crossOrigin="anonymous"
      />

      <p className="text-xs text-gray-600 mt-2">Preview - Ready to send</p>
    </div>
  )
}
