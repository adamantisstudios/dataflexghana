"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react"
import Link from "next/link"

interface VideoCardProps {
  video: {
    id: string
    title: string
    description: string
    video_url: string
    thumbnail_url: string
    duration: number
    created_by: string
    created_at: string
    view_count: number
    comment_count: number
    save_count: number
    share_count: number
  }
}

export function VideoCard({ video }: VideoCardProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Video Thumbnail */}
      <Link href={`/videos/${video.id}`}>
        <div className="relative aspect-[9/16] bg-black overflow-hidden cursor-pointer group">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url || "/placeholder.svg"}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <span className="text-gray-400">No thumbnail</span>
            </div>
          )}
          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
            {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, "0")}
          </div>
        </div>
      </Link>

      {/* Video Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold line-clamp-2 hover:text-blue-600">
            <Link href={`/videos/${video.id}`}>{video.title}</Link>
          </h3>
          <p className="text-xs text-gray-500 mt-1">{formatDate(video.created_at)}</p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs text-gray-600">
          <span>{video.view_count} views</span>
          <span>{video.comment_count} comments</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => setIsLiked(!isLiked)}>
            <Heart className={`w-4 h-4 mr-1 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            <span className="text-xs">{video.save_count}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            <MessageCircle className="w-4 h-4 mr-1" />
            <span className="text-xs">{video.comment_count}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => setIsSaved(!isSaved)}>
            <Bookmark className={`w-4 h-4 mr-1 ${isSaved ? "fill-blue-500 text-blue-500" : ""}`} />
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            <Share2 className="w-4 h-4 mr-1" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
