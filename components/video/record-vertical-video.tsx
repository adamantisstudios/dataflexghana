"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, Play, Square, Upload } from "lucide-react"
import { toast } from "sonner"

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

  const MAX_DURATION = 120

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

      const codecOptions = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]

      let mediaRecorder: MediaRecorder | null = null
      for (const codec of codecOptions) {
        if (MediaRecorder.isTypeSupported(codec)) {
          mediaRecorder = new MediaRecorder(stream, { mimeType: codec })
          break
        }
      }

      if (!mediaRecorder) {
        mediaRecorder = new MediaRecorder(stream)
      }

      chunksRef.current = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder?.mimeType || "video/webm"
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setRecordedBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)

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
      const errorMsg = err instanceof Error ? err.message : "Failed to access camera. Please check permissions."
      setError(errorMsg)
      console.error("[v0] Recording error:", err)
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
    setError(null)
    try {
      const storedAgent = localStorage.getItem("agent")
      const agent = storedAgent ? JSON.parse(storedAgent) : null

      const formData = new FormData()
      formData.append("file", recordedBlob)
      formData.append("channelId", channelId)
      formData.append("title", title)
      formData.append("duration", duration.toString())
      formData.append("description", "Mobile recorded video")
      formData.append("width", "576")
      formData.append("height", "1024")

      const headers: any = {}
      if (agent?.id) {
        headers["x-agent-id"] = agent.id
      }
      if (agent?.phone_number) {
        headers["x-agent-phone"] = agent.phone_number
      }

      let response
      let retryCount = 0
      const maxRetries = 2

      while (retryCount <= maxRetries) {
        try {
          response = await fetch("/api/videos/upload", {
            method: "POST",
            body: formData,
            headers,
            signal: AbortSignal.timeout(180000),
          })
          break // Success, exit retry loop
        } catch (err: any) {
          retryCount++
          if (retryCount > maxRetries) {
            throw err
          }
          console.log(`[v0] Upload attempt ${retryCount} failed, retrying...`)
          toast.info(`Retrying upload (attempt ${retryCount + 1}/${maxRetries + 1})...`)
          await new Promise((resolve) => setTimeout(resolve, 2000)) // Wait 2 seconds before retry
        }
      }

      if (!response?.ok) {
        let errorData: any = {}
        try {
          errorData = await response?.json()
        } catch {
          errorData = { error: `Upload failed with status ${response?.status}` }
        }
        throw new Error(errorData.error || `Upload failed with status ${response?.status}`)
      }

      const data = await response?.json()
      if (!data.success) {
        throw new Error(data.error || "Upload failed")
      }

      setRecordedBlob(null)
      setDuration(0)
      toast.success("Video uploaded successfully!")
      onUploadComplete?.(data.videoUrl)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Upload failed"
      setError(errorMsg)
      console.error("[v0] Upload error:", err)
      toast.error(errorMsg)
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

        <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
          {!recordedBlob ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <video src={URL.createObjectURL(recordedBlob)} controls className="w-full h-full object-cover" />
          )}
        </div>

        {isRecording && (
          <div className="text-center">
            <p className="text-lg font-semibold">
              {duration}s / {MAX_DURATION}s
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

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

        <p className="text-xs text-gray-500 text-center">Maximum 2 minutes • Vertical format (576x1024)</p>
      </div>
    </Card>
  )
}
