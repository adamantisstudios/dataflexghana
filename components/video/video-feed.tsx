"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { VideoCard } from "./video-card"
import { Spinner } from "@/components/ui/spinner"

interface Video {
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

interface VideoFeedProps {
  channelId: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function VideoFeed({ channelId }: VideoFeedProps) {
  const [videos, setVideos] = useState<Video[]>([])

  const { data, isLoading, error } = useSWR(`/api/videos/feed?channelId=${channelId}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // Cache for 1 minute
    focusThrottleInterval: 300000, // Revalidate every 5 minutes
  })

  useEffect(() => {
    if (data?.videos) {
      setVideos(data.videos)
    }
  }, [data])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load videos</p>
      </div>
    )
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No videos yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  )
}
