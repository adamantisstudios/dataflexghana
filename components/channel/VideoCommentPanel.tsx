"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, ChevronDown, ChevronUp, MessageCircle, Send } from "lucide-react"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

const MAX_LENGTH = 2000

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function authorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
}

export function VideoCommentPanel({ videoId, source = "upload", isOpen, onClose }: VideoCommentPanelProps) {
  const [comments, setComments] = useState<ChannelVideoComment[]>([])
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(true)
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
      setExpanded(true)
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post comment")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
            aria-label="Close comments"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex min-h-[44px] flex-1 items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-left shadow-sm transition-colors hover:border-emerald-200"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              Comments {comments.length > 0 ? `(${comments.length})` : ""}
            </span>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid min-h-0 flex-1 transition-[grid-template-rows] duration-300 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="flex min-h-0 flex-col overflow-hidden">
          <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading comments…</p>
            ) : comments.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No comments yet. Be the first!</p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800">
                      {authorInitials(comment.agent_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2">
                        <p className="text-sm font-semibold text-slate-900">{comment.agent_name}</p>
                        <span className="text-[11px] text-slate-400">{formatRelativeTime(comment.created_at)}</span>
                      </div>
                      <p className="mt-2 break-words text-sm leading-relaxed text-slate-700">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="relative flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-2 shadow-inner focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void handleSubmit()
                  }
                }}
                placeholder="Add a comment…"
                rows={2}
                disabled={submitting}
                className="min-h-[44px] max-h-28 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              <Button
                size="icon"
                onClick={() => void handleSubmit()}
                disabled={submitting || !content.trim()}
                className="h-11 w-11 shrink-0 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                aria-label="Send comment"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1.5 px-1 text-right text-[11px] tabular-nums text-slate-400">
              {content.length}/{MAX_LENGTH}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoCommentPanel
