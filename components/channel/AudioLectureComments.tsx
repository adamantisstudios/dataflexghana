"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { realtimeManager } from "@/lib/realtime-manager"
import { toast } from "sonner"
import type { AudioComment } from "@/lib/channel-audio-types"
import { formatTimestamp } from "@/lib/channel-audio-types"
import { Trash2, MessageCircle, Clock } from "lucide-react"
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
}

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
}: Props) {
  const [comments, setComments] = useState<AudioComment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState("")
  const [atTimestamp, setAtTimestamp] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [, setTick] = useState(0)

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
          "rounded-xl border border-gray-100 bg-gray-50 p-3",
          isReply && "ml-4 sm:ml-6 bg-white",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-900">{c.author_name}</p>
            {c.timestamp != null && (
              <button
                type="button"
                onClick={() => onSeek(c.timestamp!)}
                className="text-[11px] font-medium text-green-600 hover:underline mt-0.5 min-h-[44px] inline-flex items-center"
              >
                at {formatTimestamp(c.timestamp)}
              </button>
            )}
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words">{c.content}</p>
          </div>
          {canDelete && (
            <button
              type="button"
              onClick={() => void deleteComment(c.id)}
              className="shrink-0 p-2 text-gray-400 hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Delete comment"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        {!isReply && (
          <button
            type="button"
            onClick={() => setReplyTo(c.id)}
            className="mt-2 text-xs text-gray-600 hover:text-green-600 flex items-center gap-1 min-h-[44px]"
          >
            <MessageCircle className="h-3 w-3" />
            Reply
          </button>
        )}
        {c.replies.length > 0 && (
          <div className="mt-2 space-y-2">{c.replies.map((r) => renderComment(r, true))}</div>
        )}
      </div>
    )
  }

  const composer = (
    <div
      className={cn(
        layout === "panel"
          ? "shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          : cn(
              "fixed left-0 right-0 z-30 border-t border-gray-200 bg-white p-3 sm:static sm:z-auto sm:border-0 sm:p-0 sm:bg-transparent",
              composerBottomClass,
            ),
      )}
    >
      {replyTo && (
        <p className="text-xs text-gray-600 mb-2">
          Replying…{" "}
          <button type="button" className="text-green-600 underline min-h-[44px]" onClick={() => setReplyTo(null)}>
            Cancel
          </button>
        </p>
      )}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment…"
        rows={2}
        className="text-sm min-h-[44px] resize-none w-full"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            void submitComment()
          }
        }}
      />
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <Button
          type="button"
          variant={atTimestamp ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-11 min-h-[44px] text-xs",
            atTimestamp && "bg-emerald-600 hover:bg-emerald-700 text-white",
          )}
          onClick={() => setAtTimestamp((v) => !v)}
        >
          <Clock className="h-3.5 w-3.5 mr-1.5 shrink-0" />
          {atTimestamp ? `At ${currentTimeLabel}` : "Comment at current time"}
        </Button>
        <Button
          size="sm"
          disabled={submitting || !content.trim()}
          className="h-11 min-h-[44px] ml-auto bg-green-500 hover:bg-green-600 text-white px-5"
          onClick={() => void submitComment()}
        >
          {submitting ? "Sending…" : "Send"}
        </Button>
      </div>
    </div>
  )

  const commentsList = (
    <>
      {loading ? (
        <p className="text-sm text-gray-500 py-4">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-3">{comments.map((c) => renderComment(c))}</div>
      )}
    </>
  )

  if (layout === "panel") {
    return (
      <div className={cn("flex flex-1 flex-col min-h-0 overflow-hidden", className)}>
        <div className="shrink-0 px-4 pt-3 sm:px-5">
          <h3 className="text-sm font-semibold text-gray-900">Comments</h3>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-2 sm:px-5">
          {commentsList}
        </div>
        {composer}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-3 pb-32 sm:pb-4", className)}>
      <h3 className="text-sm font-semibold text-gray-900">Comments</h3>
      {commentsList}
      {composer}
    </div>
  )
}
