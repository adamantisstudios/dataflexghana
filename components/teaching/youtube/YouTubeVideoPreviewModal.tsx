"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, MessageCircle, Heart, Share2, Bookmark } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface YouTubeVideoPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  videoId: string
  title: string
  description?: string
  videoId_db: string
  userId: string
  userName: string
  onCommentAdded?: () => void
}

export function YouTubeVideoPreviewModal({
  open,
  onOpenChange,
  videoId,
  title,
  description,
  videoId_db,
  userId,
  userName,
  onCommentAdded,
}: YouTubeVideoPreviewModalProps) {
  const [commentText, setCommentText] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      toast.error("Please enter a comment")
      return
    }

    try {
      setIsSubmittingComment(true)

      const { error } = await supabase.from("youtube_video_comments").insert([
        {
          video_id: videoId_db,
          author_id: userId,
          author_name: userName,
          content: commentText,
        },
      ])

      if (error) throw error

      // Update comment count
      const { data: video } = await supabase
        .from("youtube_videos")
        .select("comment_count")
        .eq("id", videoId_db)
        .single()

      if (video) {
        await supabase
          .from("youtube_videos")
          .update({ comment_count: (video.comment_count || 0) + 1 })
          .eq("id", videoId_db)
      }

      toast.success("Comment added!")
      setCommentText("")
      onCommentAdded?.()
    } catch (error) {
      console.error("[v0] Error adding comment:", error)
      toast.error("Failed to add comment")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleLike = async () => {
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("youtube_video_likes")
          .delete()
          .eq("video_id", videoId_db)
          .eq("user_id", userId)

        if (error) throw error

        const { data: video } = await supabase.from("youtube_videos").select("like_count").eq("id", videoId_db).single()

        if (video) {
          await supabase
            .from("youtube_videos")
            .update({ like_count: Math.max(0, (video.like_count || 0) - 1) })
            .eq("id", videoId_db)
        }

        setIsLiked(false)
      } else {
        // Like
        const { error } = await supabase.from("youtube_video_likes").insert([
          {
            video_id: videoId_db,
            user_id: userId,
          },
        ])

        if (error) throw error

        const { data: video } = await supabase.from("youtube_videos").select("like_count").eq("id", videoId_db).single()

        if (video) {
          await supabase
            .from("youtube_videos")
            .update({ like_count: (video.like_count || 0) + 1 })
            .eq("id", videoId_db)
        }

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
        // Unsave
        const { error } = await supabase
          .from("youtube_video_saves")
          .delete()
          .eq("video_id", videoId_db)
          .eq("user_id", userId)

        if (error) throw error

        const { data: video } = await supabase.from("youtube_videos").select("save_count").eq("id", videoId_db).single()

        if (video) {
          await supabase
            .from("youtube_videos")
            .update({ save_count: Math.max(0, (video.save_count || 0) - 1) })
            .eq("id", videoId_db)
        }

        setIsSaved(false)
      } else {
        // Save
        const { error } = await supabase.from("youtube_video_saves").insert([
          {
            video_id: videoId_db,
            user_id: userId,
          },
        ])

        if (error) throw error

        const { data: video } = await supabase.from("youtube_videos").select("save_count").eq("id", videoId_db).single()

        if (video) {
          await supabase
            .from("youtube_videos")
            .update({ save_count: (video.save_count || 0) + 1 })
            .eq("id", videoId_db)
        }

        setIsSaved(true)
      }
    } catch (error) {
      console.error("[v0] Error toggling save:", error)
      toast.error("Failed to update save")
    }
  }

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}?video=${videoId_db}`

      if (navigator.share) {
        await navigator.share({
          title: title,
          text: description || "Check out this video",
          url: shareUrl,
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl)
        toast.success("Video link copied to clipboard!")
      }

      // Record share
      await supabase.from("youtube_video_shares").insert([
        {
          video_id: videoId_db,
          shared_by: userId,
          share_url: shareUrl,
        },
      ])
    } catch (error) {
      console.error("[v0] Error sharing:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-full p-0">
        <DialogHeader className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <DialogTitle className="text-base line-clamp-1">{title}</DialogTitle>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Full Screen Video */}
          <div className="w-full bg-black aspect-video rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          {/* Video Info */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {description && <p className="text-sm text-gray-700">{description}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 border-b pb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={handleLike}
              className={`gap-2 ${isLiked ? "bg-red-50 text-red-600 border-red-300" : ""}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              Like
            </Button>
            <Button size="sm" variant="outline" onClick={handleShare} className="gap-2 bg-transparent">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              className={`gap-2 ${isSaved ? "bg-blue-50 text-blue-600 border-blue-300" : ""}`}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
              Save
            </Button>
          </div>

          {/* Comments Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Comments
            </h3>

            {/* Add Comment */}
            <div className="space-y-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                className="text-xs"
              />
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={isSubmittingComment}
                className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
              >
                {isSubmittingComment ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
