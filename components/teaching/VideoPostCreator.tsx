"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Upload, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface VideoPostCreatorProps {
  channelId: string
  teacherId: string
  teacherName: string
  onVideoCreated: () => void
}

export function VideoPostCreator({ channelId, teacherId, teacherName, onVideoCreated }: VideoPostCreatorProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string>("")
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null)
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 })
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: 0,
  })

  const validateVideo = (file: File, width: number, height: number, duration: number): string[] => {
    const errors: string[] = []

    if (!file.type.startsWith("video/")) {
      errors.push("File must be a valid video format")
    }

    if (file.size > 1000 * 1024 * 1024) {
      errors.push(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Max 1GB.`)
    }

    if (duration > 120) {
      errors.push("Video must be 120 seconds (2 minutes) or less")
    }

    return errors
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setValidationErrors([])
    const previewURL = URL.createObjectURL(file)
    const video = document.createElement("video")
    video.src = previewURL

    video.onloadedmetadata = async () => {
      const width = video.videoWidth
      const height = video.videoHeight
      const videoDuration = Math.round(video.duration)

      const errors = validateVideo(file, width, height, videoDuration)
      if (errors.length > 0) {
        setValidationErrors(errors)
        setVideoFile(null)
        setVideoPreview("")
        return
      }

      setVideoSize({ width, height })
      setFormData((prev) => ({
        ...prev,
        duration: videoDuration,
      }))

      setVideoFile(file)
      setVideoPreview(previewURL)

      try {
        const thumbBlob = await generateThumbnail(video)
        setThumbnailBlob(thumbBlob)
        toast.success("Thumbnail generated from 1-second mark")
      } catch (err) {
        console.error("[v0] Thumbnail generation failed:", err)
        toast.warning("Could not generate thumbnail, will use video poster")
      }
    }

    video.onerror = () => {
      setValidationErrors(["Failed to load video. Please check the file."])
      setVideoFile(null)
      setVideoPreview("")
    }
  }

  const generateThumbnail = (video: HTMLVideoElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("Canvas not supported"))

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      video.currentTime = Math.min(1, video.duration * 0.1)

      video.onseeked = () => {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error("Failed to create thumbnail blob"))
              }
            },
            "image/jpeg",
            0.85,
          )
        } catch (err) {
          reject(err)
        }
      }

      video.onerror = () => reject(new Error("Failed to load video metadata"))
    })
  }

  const handleCreateVideo = async () => {
    const errors: string[] = []

    if (!formData.title.trim()) {
      errors.push("Title is required")
    }
    if (!formData.description.trim()) {
      errors.push("Description is required")
    }
    if (!videoFile) {
      errors.push("Video file is required")
    }

    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)
      setValidationErrors([])

      const storedAgent = localStorage.getItem("agent")
      const agent = storedAgent ? JSON.parse(storedAgent) : null
      if (!agent?.id || !agent?.phone_number) {
        setValidationErrors(["Session expired. Please log in again."])
        return
      }

      setUploadProgress(20)

      const uploadBody = new FormData()
      uploadBody.append("file", videoFile)
      uploadBody.append("channelId", channelId)
      uploadBody.append("title", formData.title)
      uploadBody.append("duration", formData.duration.toString())
      uploadBody.append("width", videoSize.width.toString())
      uploadBody.append("height", videoSize.height.toString())
      uploadBody.append("description", formData.description)

      if (thumbnailBlob) {
        uploadBody.append("thumbnail", thumbnailBlob, "thumbnail.jpg")
      }

      setUploadProgress(50)

      let uploadResponse
      let retryCount = 0
      const maxRetries = 2

      while (retryCount <= maxRetries) {
        try {
          uploadResponse = await fetch("/api/videos/upload", {
            method: "POST",
            body: uploadBody,
            headers: {
              "x-agent-id": agent.id,
              "x-agent-phone": agent.phone_number,
            },
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

      if (!uploadResponse?.ok) {
        let errorMessage = "Upload failed"
        try {
          const errorData = await uploadResponse?.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Upload failed with status ${uploadResponse?.status}`
        }
        throw new Error(errorMessage)
      }

      let uploadJson: any
      try {
        uploadJson = await uploadResponse?.json()
      } catch (jsonErr) {
        console.error("[v0] Failed to parse JSON:", jsonErr)
        throw new Error("Server returned invalid JSON response")
      }

      if (!uploadJson.success || !uploadJson.videoId) {
        throw new Error(uploadJson.error || "Upload completed but video ID not returned")
      }

      const { videoId } = uploadJson

      setUploadProgress(100)
      toast.success("Video posted successfully! ✅")

      // Reset form
      setShowDialog(false)
      setVideoFile(null)
      setVideoPreview("")
      setThumbnailBlob(null)
      setFormData({ title: "", description: "", duration: 0 })
      setUploadProgress(0)
      onVideoCreated()
    } catch (err: any) {
      console.error("[v0] Upload error:", err)
      setValidationErrors([err.message || "Failed to upload video"])
      toast.error(err.message || "Failed to upload video")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Post Video
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle>Post Video</DialogTitle>
          <DialogDescription>Upload an educational video (max 2 minutes, max 1GB)</DialogDescription>
        </DialogHeader>

        {validationErrors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded space-y-1">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                {validationErrors.map((error, idx) => (
                  <p key={idx} className="text-sm text-red-700">
                    • {error}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 py-4 w-full">
          {/* Video Upload */}
          <div className="grid gap-2">
            <Label>Video File</Label>

            <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                disabled={isUploading}
                className="hidden"
                id="video-input"
              />
              <label htmlFor="video-input" className="cursor-pointer block">
                <Upload className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium">Click to upload or drag a file</p>
                <p className="text-xs text-gray-500 mt-1">Max 2 min • Max 1GB • With sound</p>
              </label>
            </div>

            {videoPreview && (
              <div className="relative w-full aspect-[9/16] bg-black rounded overflow-hidden">
                <video src={videoPreview} className="w-full h-full object-cover" controls playsInline />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="grid gap-2">
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter video title"
              disabled={isUploading}
              className="border-purple-200"
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label>Description *</Label>
            <Textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter video description"
              disabled={isUploading}
              className="border-purple-200"
            />
          </div>

          {/* Duration Display */}
          {formData.duration > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded p-2">
              <p className="text-sm text-purple-900">
                <span className="font-medium">Duration:</span> {formatDuration(formData.duration)}
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">Uploading...</span>
                <span className="text-xs font-semibold text-purple-600">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isUploading} onClick={() => setShowDialog(false)}>
            Cancel
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            disabled={isUploading || !videoFile}
            onClick={handleCreateVideo}
          >
            {isUploading ? "Uploading..." : "Post Video"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
