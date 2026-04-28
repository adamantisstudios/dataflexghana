"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Maximize2, MessageCircle, Heart, Share2, Bookmark } from "lucide-react"

interface YouTubeVideoFrameProps {
  videoId: string
  title: string
  description?: string
  viewCount?: number
  likeCount?: number
  commentCount?: number
  authorName?: string
  onFullScreen?: () => void
  onLike?: () => void
  onComment?: () => void
  onShare?: () => void
  onSave?: () => void
  isLiked?: boolean
  isSaved?: boolean
}

export function YouTubeVideoFrame({
  videoId,
  title,
  description,
  viewCount = 0,
  likeCount = 0,
  commentCount = 0,
  authorName,
  onFullScreen,
  onLike,
  onComment,
  onShare,
  onSave,
  isLiked = false,
  isSaved = false,
}: YouTubeVideoFrameProps) {
  const [hovering, setHovering] = useState(false)

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Video Container */}
      <div
        className="relative w-full bg-black aspect-video group"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* YouTube Embed */}
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />

        {/* Full Screen Button - Top Right */}
        {hovering && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onFullScreen}
            className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white border-0 h-8 w-8 p-0 rounded-full"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Video Info */}
      <div className="p-3 space-y-2">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{title}</h3>
          {authorName && <p className="text-xs text-gray-600 mt-0.5">By {authorName}</p>}
        </div>

        {description && <p className="text-xs text-gray-700 line-clamp-2">{description}</p>}

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-600 pt-1 border-t border-gray-200">
          <span>{viewCount.toLocaleString()} views</span>
          <span>{likeCount.toLocaleString()} likes</span>
          <span>{commentCount.toLocaleString()} comments</span>
        </div>

        <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-200 w-full">
          <Button
            size="sm"
            variant="ghost"
            onClick={onLike}
            className={`flex-1 min-w-[70px] h-8 text-xs gap-1 flex items-center justify-center ${isLiked ? "text-red-600" : "text-gray-600"}`}
          >
            <Heart className={`h-3.5 w-3.5 flex-shrink-0 ${isLiked ? "fill-current" : ""}`} />
            <span className="truncate">Like</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onComment}
            className="flex-1 min-w-[70px] h-8 text-xs gap-1 flex items-center justify-center text-gray-600"
          >
            <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">Comment</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onShare}
            className="flex-1 min-w-[70px] h-8 text-xs gap-1 flex items-center justify-center text-gray-600"
          >
            <Share2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">Share</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onSave}
            className={`flex-1 min-w-[70px] h-8 text-xs gap-1 flex items-center justify-center ${isSaved ? "text-blue-600" : "text-gray-600"}`}
          >
            <Bookmark className={`h-3.5 w-3.5 flex-shrink-0 ${isSaved ? "fill-current" : ""}`} />
            <span className="truncate">Save</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
