"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, Play, Square, Upload } from 'lucide-react'

interface RecordVerticalVideoProps {
  channelId: string
  onUploadComplete?: (videoUrl: string) => void
}

export function RecordVerticalVideo({ channelId, onUploadComplete }: RecordVerticalVideoProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const MAX_DURATION = 60 // 60 seconds

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 576 },
          height: { ideal: 1024 },
          facingMode: "user",
        },
        audio: true,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9,opus",
      })

      chunksRef.current = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" })
        setRecordedBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)

      // Auto-stop after MAX_DURATION
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording()
            return MAX_DURATION
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to access camera. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const uploadVideo = async (title = "Untitled Video") => {
    if (!recordedBlob) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", recordedBlob)
      formData.append("channelId", channelId)
      formData.append("title", title)
      formData.append("duration", duration.toString())
      formData.append("description", "Mobile recorded video")
      formData.append("width", "576")
      formData.append("height", "1024")

      const response = await fetch("/api/videos/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Upload failed with status ${response.status}`)
      }

      const data = await response.json()
      setRecordedBlob(null)
      setDuration(0)
      onUploadComplete?.(data.videoUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Record Video</h2>

        {/* Video Preview */}
        <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
          {!recordedBlob ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <video src={URL.createObjectURL(recordedBlob)} controls className="w-full h-full object-cover" />
          )}
        </div>

        {/* Duration Display */}
        {isRecording && (
          <div className="text-center">
            <p className="text-lg font-semibold">
              {duration}s / {MAX_DURATION}s
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isRecording && !recordedBlob && (
            <Button onClick={startRecording} className="flex-1" size="lg">
              <Play className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <Button onClick={stopRecording} variant="destructive" className="flex-1" size="lg">
              <Square className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
          )}

          {recordedBlob && (
            <>
              <Button onClick={() => setRecordedBlob(null)} variant="outline" className="flex-1" disabled={isUploading}>
                Retake
              </Button>
              <Button onClick={() => uploadVideo()} className="flex-1" disabled={isUploading} size="lg">
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center">Maximum 60 seconds • Vertical format (576x1024)</p>
      </div>
    </Card>
  )
}
