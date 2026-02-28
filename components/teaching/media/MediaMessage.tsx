"use client"

import { MediaGallery } from "./MediaGallery"

interface MediaItem {
  id: string
  media_type: "image" | "audio"
  media_url: string
  file_name: string
  thumbnail_url?: string
  duration?: number
}

interface MediaMessageProps {
  content?: string
  media: MediaItem[]
  senderName: string
  senderAvatar?: string
  timestamp: Date
  isOwn?: boolean
}

export function MediaMessage({
  content,
  media,
  senderName,
  senderAvatar,
  timestamp,
  isOwn = false,
}: MediaMessageProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <div className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
      {senderAvatar && !isOwn && <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />}

      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && <div className="text-xs font-medium text-gray-600 mb-1">{senderName}</div>}

        <div className={`rounded-lg p-3 max-w-md ${isOwn ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"}`}>
          {content && <p className="text-sm mb-2">{content}</p>}

          {media.length > 0 && <MediaGallery media={media} maxVisible={3} />}
        </div>

        <div className="text-xs text-gray-500 mt-1">{formatTime(timestamp)}</div>
      </div>
    </div>
  )
}
