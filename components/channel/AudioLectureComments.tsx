"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { realtimeManager } from "@/lib/realtime-manager"
import { toast } from "sonner"
import type { AudioComment } from "@/lib/channel-audio-types"
import { formatTimestamp } from "@/lib/channel-audio-types"
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MessageCircle,
  Send,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  lectureId: string
  currentUserId: string
  currentUserName: string
  isChannelAdmin?: boolean
  getCurrentPlaybackTime: () => number
  onSeek: (seconds: number) => void
  layout?: "panel" | "inline"
  className?: string
  composerBottomClass?: string
  defaultExpanded?: boolean
}

const MAX_COMMENT_LENGTH = 2000

function mergeComment(tree: AudioComment[], incoming: AudioComment): AudioComment[] {
  if (!incoming.parent_id) {
    if (tree.some((c) => c.id === incoming.id)) return tree
    return [incoming, ...tree]
  }
  return tree.map((c) => {
    if (c.id === incoming.parent_id) {
      if (c.replies.some((r) => r.id === incoming.id)) return c
      return { ...c, replies: [...c.replies, incoming] }
    }
    return c
  })
}

function authorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function countComments(comments: AudioComment[]): number {
  return comments.reduce((sum, c) => sum + 1 + c.replies.length, 0)
}

export function AudioLectureComments({
  lectureId,
  currentUserId,
  currentUserName,
  isChannelAdmin = false,
  getCurrentPlaybackTime,
  onSeek,
  layout = "inline",
  className,
  composerBottomClass = "bottom-0",
  defaultExpanded = false,
}: Props) {
  const [comments, setComments] = useState<AudioComment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState("")
  const [atTimestamp, setAtTimestamp] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [, setTick] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const totalCount = countComments(comments)

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/channel/audio/${lectureId}`, {
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      if (res.ok) {
        setComments(data.comments || [])
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [lectureId])

  useEffect(() => {
    setLoading(true)
    void loadComments()
  }, [loadComments])

  useEffect(() => {
    const unsub = realtimeManager.subscribe(
      `audio_comments_${lectureId}`,
      "channel_audio_comments",
      (payload) => {
        if (payload.eventType === "INSERT" && payload.new) {
          const row = payload.new as AudioComment & { author_id: string }
          const incoming: AudioComment = {
            ...row,
            author_name:
              String(row.author_id) === currentUserId
                ? currentUserName
                : row.author_name || "Member",
            replies: [],
          }
          setComments((prev) => mergeComment(prev, incoming))
        }
        if (payload.eventType === "DELETE" && payload.old) {
          const id = String((payload.old as { id: string }).id)
          setComments((prev) =>
            prev
              .filter((c) => c.id !== id)
              .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== id) })),
          )
        }
      },
      `lecture_id=eq.${lectureId}`,
    )
    return () => unsub()
  }, [lectureId, currentUserId, currentUserName])

  useEffect(() => {
    if (!atTimestamp) return
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [atTimestamp])

  const currentTimeLabel = formatTimestamp(Math.floor(getCurrentPlaybackTime()))

  const submitComment = async () => {
    if (!content.trim() || submitting) return
    setSubmitting(true)
    try {
      const timestamp = atTimestamp ? Math.floor(getCurrentPlaybackTime()) : null
      const res = await fetch(`/api/channel/audio/${lectureId}/comments`, {
        method: "POST",
        headers: getAgentAuthHeaders(),
        body: JSON.stringify({
          content: content.trim(),
          timestamp,
          parent_id: replyTo,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to post comment")

      if (String(data.comment.author_id) === currentUserId) {
        setComments((prev) => mergeComment(prev, data.comment))
      } else {
        void loadComments()
      }
      setContent("")
      setReplyTo(null)
      setAtTimestamp(false)
      setExpanded(true)
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post comment")
    } finally {
      setSubmitting(false)
    }
  }

  const deleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/channel/audio/comments/${commentId}`, {
        method: "DELETE",
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Delete failed")
      setComments((prev) =>
        prev
          .filter((c) => c.id !== commentId)
          .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== commentId) })),
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete")
    }
  }

  const renderComment = (c: AudioComment, isReply = false) => {
    const canDelete = c.author_id === currentUserId || isChannelAdmin
    return (
      <div
        key={c.id}
        className={cn(
          "rounded-2xl border border-slate-100 bg-white p-3 shadow-sm",
          isReply && "ml-4 sm:ml-8 border-slate-50 bg-slate-50/80",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800">
            {authorInitials(c.author_name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <p className="text-sm font-semibold text-slate-900">{c.author_name}</p>
              <span className="text-[11px] text-slate-400">{formatRelativeTime(c.created_at)}</span>
            </div>
            {c.timestamp != null && (
              <button
                type="button"
                onClick={() => onSeek(c.timestamp!)}
                className="mt-1 inline-flex min-h-[32px] items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <Clock className="mr-1 h-3 w-3" />
                {formatTimestamp(c.timestamp)}
              </button>
            )}
            <p className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap break-words">
              {c.content}
            </p>
            {!isReply && (
              <button
                type="button"
                onClick={() => {
                  setReplyTo(c.id)
                  setExpanded(true)
                }}
                className="mt-2 inline-flex min-h-[36px] items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-emerald-600"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Reply
              </button>
            )}
          </div>
          {canDelete && (
            <button
              type="button"
              onClick={() => void deleteComment(c.id)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label="Delete comment"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        {c.replies.length > 0 && (
          <div className="mt-3 space-y-2">{c.replies.map((r) => renderComment(r, true))}</div>
        )}
      </div>
    )
  }

  const toggleButton = (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-left shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/30"
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <MessageCircle className="h-4 w-4 text-emerald-600" />
        Comments {totalCount > 0 ? `(${totalCount})` : ""}
      </span>
      {expanded ? (
        <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
      ) : (
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
      )}
    </button>
  )

  const composer = (
    <div
      className={cn(
        "space-y-2",
        layout === "panel"
          ? "shrink-0 border-t border-slate-100 bg-white p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          : cn(
              "border-t border-slate-100 bg-white p-3 sm:static sm:border-0 sm:p-0 sm:bg-transparent",
              !expanded && layout === "inline" && "hidden",
              layout === "inline" && expanded && "fixed left-0 right-0 z-30 sm:relative sm:z-auto",
              composerBottomClass,
            ),
      )}
    >
      {replyTo && (
        <p className="text-xs text-slate-500">
          Replying…{" "}
          <button type="button" className="font-medium text-emerald-600 underline min-h-[44px]" onClick={() => setReplyTo(null)}>
            Cancel
          </button>
        </p>
      )}
      <div className="relative flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-2 shadow-inner focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
          placeholder="Write a comment…"
          rows={2}
          className="min-h-[44px] max-h-32 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void submitComment()
            }
          }}
        />
        <Button
          type="button"
          size="icon"
          disabled={submitting || !content.trim()}
          className="h-11 w-11 shrink-0 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          onClick={() => void submitComment()}
          aria-label="Send comment"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-11 min-h-[44px] rounded-full border-slate-200 text-xs font-medium",
            atTimestamp && "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm",
          )}
          onClick={() => setAtTimestamp((v) => !v)}
        >
          <Clock className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          {atTimestamp ? `At ${currentTimeLabel}` : "Timestamp"}
        </Button>
        <span className="text-[11px] tabular-nums text-slate-400">
          {content.length}/{MAX_COMMENT_LENGTH}
        </span>
      </div>
    </div>
  )

  const commentsBody = (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-300 ease-out",
        expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
    >
      <div className="overflow-hidden">
        <div className={cn("flex min-h-0 flex-col", layout === "panel" && "h-full max-h-[40vh]")}>
          <div
            ref={listRef}
            className={cn(
              "min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain",
              layout === "panel" ? "px-4 py-3 sm:px-5" : "py-2",
            )}
          >
          {loading ? (
            <p className="py-4 text-center text-sm text-slate-500">Loading comments…</p>
          ) : comments.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">No comments yet. Be the first!</p>
          ) : (
            comments.map((c) => renderComment(c))
          )}
          </div>
          {composer}
        </div>
      </div>
    </div>
  )

  if (layout === "panel") {
    return (
      <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
        <div className="shrink-0 px-4 pt-3 sm:px-5">{toggleButton}</div>
        {commentsBody}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {toggleButton}
      {commentsBody}
      {!expanded && (
        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-center text-xs text-slate-500">
          Tap comments to join the discussion
        </div>
      )}
    </div>
  )
}
