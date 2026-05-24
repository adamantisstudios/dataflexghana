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
      className={`flex flex-col h-full bg-zinc-900/95 backdrop-blur-md transition-transform duration-300 ease-out ${
        isOpen ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Close comments"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <MessageCircle className="h-4 w-4" />
          Comments {comments.length > 0 ? `(${comments.length})` : ""}
        </span>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {loading ? (
          <p className="text-center text-sm text-white/60 py-8">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-center text-sm text-white/60 py-8">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-lg bg-white/5 px-3 py-2">
              <p className="text-xs font-semibold text-[#35B24A] select-none">{comment.agent_name}</p>
              <p className="text-sm text-white/90 mt-0.5 break-words">{comment.content}</p>
              <p className="text-[10px] text-white/40 mt-1">{formatTimestamp(comment.created_at)}</p>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10 shrink-0">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Add a comment..."
          className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm h-9"
          disabled={submitting}
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
          className="bg-[#0E8F3D] hover:bg-[#35B24A] text-white h-9 px-3"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default VideoCommentPanel
