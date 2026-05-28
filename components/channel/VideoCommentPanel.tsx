"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, MessageCircle, Send } from "lucide-react"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export interface ChannelVideoComment {
  id: string
  content: string
  created_at: string
  agent_name: string
}

interface VideoCommentPanelProps {
  videoId: string
  source?: "upload" | "embed"
  isOpen: boolean
  onClose: () => void
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}

export function VideoCommentPanel({ videoId, source = "upload", isOpen, onClose }: VideoCommentPanelProps) {
  const [comments, setComments] = useState<ChannelVideoComment[]>([])
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const loadComments = useCallback(async () => {
    if (!videoId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ source })
      const res = await fetch(`/api/channel/videos/${videoId}/comments?${params}`, {
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      if (res.ok) {
        setComments(data.comments || [])
      } else {
        toast.error(data.error || "Failed to load comments")
      }
    } catch {
      toast.error("Failed to load comments")
    } finally {
      setLoading(false)
    }
  }, [videoId, source])

  useEffect(() => {
    if (isOpen && videoId) loadComments()
  }, [isOpen, videoId, loadComments])

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/channel/videos/${videoId}/comments`, {
        method: "POST",
        headers: { ...getAgentAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), source }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to post comment")
      setComments((prev) => [data.comment, ...prev])
      setContent("")
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post comment")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={`flex h-full flex-col bg-white transition-transform duration-300 ease-out ${
        isOpen ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="shrink-0 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-900 hover:bg-gray-200"
          aria-label="Close comments"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <MessageCircle className="h-4 w-4" />
          Comments {comments.length > 0 ? `(${comments.length})` : ""}
        </span>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
              <p className="select-none text-xs font-semibold text-green-700">{comment.agent_name}</p>
              <p className="mt-1 break-words text-sm text-gray-900">{comment.content}</p>
              <p className="mt-1 text-[10px] text-gray-500">{formatTimestamp(comment.created_at)}</p>
            </div>
          ))
        )}
      </div>

      <div className="sticky bottom-0 flex shrink-0 items-center gap-2 border-t border-gray-100 bg-white px-4 py-3">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Add a comment..."
          className="h-11 flex-1 border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400"
          disabled={submitting}
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
          className="h-11 bg-green-500 px-4 text-white hover:bg-green-600"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default VideoCommentPanel
