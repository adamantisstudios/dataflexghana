"use client"
import { useState, useEffect } from "react"
import { YouTubeVideoFrame } from "./YouTubeVideoFrame"
import { YouTubeVideoPreviewModal } from "./YouTubeVideoPreviewModal"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface YouTubeVideoDisplayProps {
  id: string
  title: string
  description?: string
  youtubeVideoId: string
  viewCount?: number
  likeCount?: number
  commentCount?: number
  saveCount?: number
  authorName?: string
  userId: string
  userName: string
  onDelete?: (id: string) => void
}

export function YouTubeVideoDisplay({
  id,
  title,
  description,
  youtubeVideoId,
  viewCount = 0,
  likeCount = 0,
  commentCount = 0,
  saveCount = 0,
  authorName,
  userId,
  userName,
  onDelete,
}: YouTubeVideoDisplayProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [currentLikeCount, setCurrentLikeCount] = useState(likeCount)
  const [currentCommentCount, setCurrentCommentCount] = useState(commentCount)
  const [currentSaveCount, setCurrentSaveCount] = useState(saveCount)
  const [hasCheckedInteractions, setHasCheckedInteractions] = useState(false)

  useEffect(() => {
    if (!hasCheckedInteractions && userId && id) {
      checkUserInteractions()
      setHasCheckedInteractions(true)
    }
  }, [id, userId]) // Removed hasCheckedInteractions from dependency array to prevent re-runs

  const checkUserInteractions = async () => {
    try {
      try {
        const { data: likeData, error: likeError } = await supabase
          .from("youtube_video_likes")
          .select("id")
          .eq("video_id", id)
          .eq("user_id", userId)
          .single()

        if (!likeError && likeData) {
          setIsLiked(true)
        }
      } catch (error) {
        // Silently fail - don't log errors that cascade
      }

      try {
        const { data: saveData, error: saveError } = await supabase
          .from("youtube_video_saves")
          .select("id")
          .eq("video_id", id)
          .eq("user_id", userId)
          .single()

        if (!saveError && saveData) {
          setIsSaved(true)
        }
      } catch (error) {
        // Silently fail - don't log errors that cascade
      }
    } catch (error) {
      // Silently fail to prevent stack overflow
    }
  }

  const handleLike = async () => {
    try {
      if (isLiked) {
        await supabase.from("youtube_video_likes").delete().eq("video_id", id).eq("user_id", userId)

        setCurrentLikeCount(Math.max(0, currentLikeCount - 1))
        setIsLiked(false)
      } else {
        await supabase.from("youtube_video_likes").insert([
          {
            video_id: id,
            user_id: userId,
          },
        ])

        setCurrentLikeCount(currentLikeCount + 1)
        setIsLiked(true)
      }
    } catch (error) {
      console.error("[v0] Error toggling like:", error)
      toast.error("Failed to update like")
    }
  }

  const handleSave = async () => {
    try {
      if (isSaved) {
        await supabase.from("youtube_video_saves").delete().eq("video_id", id).eq("user_id", userId)

        setCurrentSaveCount(Math.max(0, currentSaveCount - 1))
        setIsSaved(false)
      } else {
        await supabase.from("youtube_video_saves").insert([
          {
            video_id: id,
            user_id: userId,
          },
        ])

        setCurrentSaveCount(currentSaveCount + 1)
        setIsSaved(true)
      }
    } catch (error) {
      console.error("[v0] Error toggling save:", error)
      toast.error("Failed to update save")
    }
  }

  return (
    <>
      <YouTubeVideoFrame
        videoId={youtubeVideoId}
        title={title}
        description={description}
        viewCount={viewCount}
        likeCount={currentLikeCount}
        commentCount={currentCommentCount}
        authorName={authorName}
        onFullScreen={() => setShowPreview(true)}
        onLike={handleLike}
        onComment={() => setShowPreview(true)}
        onShare={() => setShowPreview(true)}
        onSave={handleSave}
        isLiked={isLiked}
        isSaved={isSaved}
      />

      <YouTubeVideoPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        videoId={youtubeVideoId}
        title={title}
        description={description}
        videoId_db={id}
        userId={userId}
        userName={userName}
        onCommentAdded={() => {
          setCurrentCommentCount(currentCommentCount + 1)
        }}
      />
    </>
  )
}
