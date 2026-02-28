"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Share2, Bookmark } from "lucide-react"

interface VideoInteractionsProps {
  videoId: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function VideoInteractions({ videoId }: VideoInteractionsProps) {
  const [activeTab, setActiveTab] = useState<"comments" | "shares" | "saves">("comments")
  const [commentText, setCommentText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: commentsData, mutate: mutateComments } = useSWR(`/api/videos/${videoId}/comments`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  })

  const handleAddComment = async () => {
    if (!commentText.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      })

      if (response.ok) {
        setCommentText("")
        mutateComments() // Revalidate comments
      }
    } catch (error) {
      console.error("[v0] Comment submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveVideo = async () => {
    try {
      await fetch(`/api/videos/${videoId}/save`, {
        method: "POST",
      })
      mutateComments() // Trigger revalidation
    } catch (error) {
      console.error("[v0] Save error:", error)
    }
  }

  const handleShareVideo = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this video",
          url: window.location.href,
        })
      } catch (error) {
        console.error("[v0] Share error:", error)
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "comments" ? "default" : "outline"}
          onClick={() => setActiveTab("comments")}
          className="flex-1"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Comments ({commentsData?.comments?.length || 0})
        </Button>
        <Button variant="outline" onClick={handleSaveVideo} className="flex-1 bg-transparent">
          <Bookmark className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button variant="outline" onClick={handleShareVideo} className="flex-1 bg-transparent">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>

      {/* Comments Section */}
      {activeTab === "comments" && (
        <Card className="p-4 space-y-4">
          {/* Add Comment */}
          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-20"
            />
            <Button onClick={handleAddComment} disabled={isSubmitting || !commentText.trim()} className="w-full">
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>

          {/* Comments List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {commentsData?.comments?.map((comment: any) => (
              <div key={comment.id} className="border-t pt-3">
                <p className="font-semibold text-sm">{comment.user_name}</p>
                <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(comment.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
