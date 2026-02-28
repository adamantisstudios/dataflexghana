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
        const { data: likeData } = await supabase
          .from("youtube_video_likes")
          .select("id")
          .eq("video_id", id)
          .eq("user_id", userId)
          .single()

        if (likeData) {
          setIsLiked(true)
        }
      } catch (error: any) {
        // Silently handle RLS errors (406) - user interactions just won't show pre-populated state
        if (error?.status !== 406) {
          console.error("[v0] Like check error:", error)
        }
      }

      try {
        const { data: saveData } = await supabase
          .from("youtube_video_saves")
          .select("id")
          .eq("video_id", id)
          .eq("user_id", userId)
          .single()

        if (saveData) {
          setIsSaved(true)
        }
      } catch (error: any) {
        // Silently handle RLS errors (406) - user interactions just won't show pre-populated state
        if (error?.status !== 406) {
          console.error("[v0] Save check error:", error)
        }
      }
    } catch (error) {
      // Silently fail to prevent cascading errors
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
    } catch (error: any) {
      if (error?.status === 406) {
        toast.error("You don't have permission to like this video")
      } else {
        console.error("[v0] Error toggling like:", error)
        toast.error("Failed to update like")
      }
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
    } catch (error: any) {
      if (error?.status === 406) {
        toast.error("You don't have permission to save this video")
      } else {
        console.error("[v0] Error toggling save:", error)
        toast.error("Failed to update save")
      }
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
