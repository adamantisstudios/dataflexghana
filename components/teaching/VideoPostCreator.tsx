"use client"
import { useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { Plus, Upload } from "lucide-react"
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
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_type: "lesson" as "lesson" | "tutorial" | "announcement" | "discussion",
    duration: 0,
  })

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file")
      return
    }

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      toast.error("Video file must be less than 500MB")
      return
    }

    setVideoFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setVideoPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Get video duration
    const video = document.createElement("video")
    video.onloadedmetadata = () => {
      setFormData((prev) => ({ ...prev, duration: Math.round(video.duration) }))
    }
    video.src = URL.createObjectURL(file)
  }

  const handleCreateVideo = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Title and description are required")
      return
    }

    if (!videoFile) {
      toast.error("Please select a video file")
      return
    }

    if (formData.duration > 60) {
      toast.error("Video must be 60 seconds or less for vertical format")
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Check user role
      const { data: membership, error: memberError } = await supabase
        .from("channel_members")
        .select("role")
        .eq("channel_id", channelId)
        .eq("agent_id", teacherId)
        .single()

      if (memberError || !membership) {
        toast.error("You don't have permission to post videos in this channel")
        return
      }

      if (membership.role !== "admin" && membership.role !== "teacher") {
        toast.error("Only admins and teachers can post videos")
        return
      }

      const formDataForUpload = new FormData()
      formDataForUpload.append("file", videoFile)
      formDataForUpload.append("channelId", channelId)
      formDataForUpload.append("title", formData.title)
      formDataForUpload.append("duration", formData.duration.toString())

      const storedAgent = localStorage.getItem("agent")
      const agent = storedAgent ? JSON.parse(storedAgent) : null

      if (!agent?.id || !agent?.phone_number) {
        console.error("[v0] Agent session invalid:", {
          hasAgent: !!agent,
          hasId: !!agent?.id,
          hasPhone: !!agent?.phone_number,
          agentKeys: agent ? Object.keys(agent) : [],
        })
        toast.error("Session expired. Please log in again.")
        return
      }

      const uploadResponse = await fetch("/api/videos/upload", {
        method: "POST",
        body: formDataForUpload,
        headers: {
          "x-agent-id": agent.id,
          "x-agent-phone": agent.phone_number,
        },
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || `Upload failed with status ${uploadResponse.status}`)
      }

      const responseData = await uploadResponse.json()

      if (!responseData.success) {
        throw new Error(responseData.error || "Upload failed")
      }

      const { videoId, url: videoUrl } = responseData

      // Update the video record with additional metadata (video_type, description, author info)
      const { error: updateError } = await supabase
        .from("videos")
        .update({
          description: formData.description,
          video_type: formData.video_type,
          agent_id: teacherId,
          author_name: teacherName,
          view_count: 0,
          like_count: 0,
          comment_count: 0,
          is_published: true,
        })
        .eq("id", videoId)

      if (updateError) {
        console.error("[v0] Error updating video metadata:", updateError)
        throw updateError
      }

      toast.success("Video posted successfully!")
      setShowDialog(false)
      setVideoFile(null)
      setVideoPreview("")
      setFormData({
        title: "",
        description: "",
        video_type: "lesson",
        duration: 0,
      })
      onVideoCreated()
    } catch (error) {
      console.error("[v0] Error creating video:", error)
      toast.error(error instanceof Error ? error.message : "Failed to post video")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    return `${minutes}m ${secs}s`
  }

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
          <DialogTitle>Post Video to Channel</DialogTitle>
          <DialogDescription>
            Share an educational vertical video with your channel members (max 60 seconds)
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 w-full">
          {/* Video Upload Section */}
          <div className="grid gap-2">
            <Label htmlFor="video-file">Video File</Label>
            <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer">
              <input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                disabled={isUploading}
                className="hidden"
              />
              <label htmlFor="video-file" className="cursor-pointer block">
                <Upload className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">MP4, WebM, or other video formats (max 500MB, 60 seconds)</p>
              </label>
            </div>

            {videoFile && (
              <div className="bg-purple-50 border border-purple-200 rounded p-3">
                <p className="text-sm font-medium text-purple-900">Selected: {videoFile.name}</p>
                <p className="text-xs text-purple-700 mt-1">
                  Size: {(videoFile.size / 1024 / 1024).toFixed(2)}MB • Duration: {formatDuration(formData.duration)}
                </p>
              </div>
            )}

            {videoPreview && (
              <div className="relative w-full bg-black rounded overflow-hidden">
                <video src={videoPreview} controls className="w-full h-auto max-h-48" />
              </div>
            )}
          </div>

          {/* Video Type */}
          <div className="grid gap-2">
            <Label htmlFor="video-type">Video Type</Label>
            <Select
              value={formData.video_type}
              onValueChange={(val) => setFormData({ ...formData, video_type: val as any })}
              disabled={isUploading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lesson">Lesson</SelectItem>
                <SelectItem value="tutorial">Tutorial</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="discussion">Discussion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="video-title">Title</Label>
            <Input
              id="video-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Video title"
              disabled={isUploading}
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="video-description">Description</Label>
            <Textarea
              id="video-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Video description (supports markdown)"
              rows={4}
              disabled={isUploading}
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-sm font-medium text-blue-900">Uploading video...</p>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowDialog(false)
              setVideoFile(null)
              setVideoPreview("")
            }}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreateVideo}
            disabled={isUploading || !videoFile}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isUploading ? "Uploading..." : "Post Video"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
