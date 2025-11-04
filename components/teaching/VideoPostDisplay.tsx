"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Trash2, Eye, MessageSquare, ThumbsUp } from "lucide-react"
import { toast } from "sonner"

interface VideoPostDisplayProps {
  id: string
  title: string
  description: string
  videoType: "lesson" | "tutorial" | "announcement" | "discussion"
  videoUrl: string
  duration: number
  viewCount: number
  likeCount: number
  commentCount: number
  authorName: string
  createdAt: string
  isTeacher: boolean
  currentUserId: string
  onDelete: (videoId: string) => void
}

export function VideoPostDisplay({
  id,
  title,
  description,
  videoType,
  videoUrl,
  duration,
  viewCount,
  likeCount,
  commentCount,
  authorName,
  createdAt,
  isTeacher,
  currentUserId,
  onDelete,
}: VideoPostDisplayProps) {
  const [showVideo, setShowVideo] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this video?")) return

    try {
      setIsDeleting(true)
      onDelete(id)
    } catch (error) {
      console.error("[v0] Error deleting video:", error)
      toast.error("Failed to delete video")
    } finally {
      setIsDeleting(false)
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <Card className="border-purple-200 overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Video Thumbnail/Player */}
        <div className="relative bg-black aspect-video flex items-center justify-center group cursor-pointer">
          {showVideo ? (
            <video src={videoUrl} controls autoPlay className="w-full h-full" />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40"></div>
              <Button
                size="lg"
                className="relative bg-purple-600 hover:bg-purple-700 rounded-full h-12 w-12"
                onClick={() => setShowVideo(true)}
              >
                <Play className="h-5 w-5 fill-white" />
              </Button>
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded text-xs">
                {formatDuration(duration)}
              </div>
            </>
          )}
        </div>

        {/* Video Info */}
        <div className="p-2 space-y-2">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-1">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 break-words">{title}</h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  By {authorName} • {formatDateTime(createdAt)}
                </p>
              </div>
              {isTeacher && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-shrink-0 h-6 w-6 p-0"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                {videoType}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-700 line-clamp-2">{description}</p>

          {/* Stats */}
          <div className="flex items-center gap-2 text-xs text-gray-600 pt-1 border-t border-gray-200">
            <span className="flex items-center gap-0.5">
              <Eye className="h-2.5 w-2.5" />
              {viewCount}
            </span>
            <span className="flex items-center gap-0.5">
              <ThumbsUp className="h-2.5 w-2.5" />
              {likeCount}
            </span>
            <span className="flex items-center gap-0.5">
              <MessageSquare className="h-2.5 w-2.5" />
              {commentCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
