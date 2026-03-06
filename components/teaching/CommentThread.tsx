"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Heart, Trash2, Edit2, Reply, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Comment {
  id: string
  post_id: string
  author_id: string
  author_name?: string
  content: string
  parent_comment_id?: string
  is_edited: boolean
  edited_at?: string
  is_deleted: boolean
  created_at: string
  replies?: Comment[]
  reaction_count?: number
  user_reaction?: string
}

interface CommentThreadProps {
  postId: string
  currentUserId: string
  currentUserName: string
  isTeacher?: boolean
  channelId?: string
  isMember?: boolean
}

export function CommentThread({
  postId,
  currentUserId,
  currentUserName,
  isTeacher = false,
  channelId,
  isMember = true,
}: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Load comments on mount
  useEffect(() => {
    loadComments()
  }, [postId])

  const loadComments = async () => {
    try {
      setLoading(true)
      const client = supabaseAdmin || supabase
      const { data, error } = await client
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .is("parent_comment_id", null)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading comments:", error.message, error.details)
        throw error
      }

      // Load replies for each comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: replies, error: repliesError } = await client
            .from("post_comments")
            .select("*")
            .eq("parent_comment_id", comment.id)
            .eq("is_deleted", false)
            .order("created_at", { ascending: true })

          if (repliesError) {
            console.error("[v0] Error loading replies:", repliesError.message)
          }

          return {
            ...comment,
            replies: replies || [],
          }
        }),
      )

      setComments(commentsWithReplies)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("[v0] Error loading comments:", errorMessage)
      toast.error("Failed to load comments")
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty")
      return
    }

    if (channelId && !isMember) {
      toast.error("You must be a member of this channel to comment")
      return
    }

    try {
      const client = supabaseAdmin || supabase
      const { error } = await client.from("post_comments").insert([
        {
          post_id: postId,
          author_id: currentUserId,
          author_name: currentUserName,
          content: newComment,
          is_edited: false,
          is_deleted: false,
          created_at: new Date().toISOString(),
        },
      ])

      if (error) {
        console.error("[v0] Error posting comment:", error.message, error.details, error.code)
        throw error
      }

      toast.success("Comment posted!")
      setNewComment("")
      loadComments()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("[v0] Error posting comment:", errorMessage)
      toast.error("Failed to post comment")
    }
  }

  const handleAddReply = async (parentCommentId: string) => {
    if (!replyText.trim()) {
      toast.error("Reply cannot be empty")
      return
    }

    if (channelId && !isMember) {
      toast.error("You must be a member of this channel to reply")
      return
    }

    try {
      const client = supabaseAdmin || supabase
      const { error } = await client.from("post_comments").insert([
        {
          post_id: postId,
          author_id: currentUserId,
          author_name: currentUserName,
          content: replyText,
          parent_comment_id: parentCommentId,
          is_edited: false,
          is_deleted: false,
          created_at: new Date().toISOString(),
        },
      ])

      if (error) {
        console.error("[v0] Error posting reply:", error.message, error.details)
        throw error
      }

      toast.success("Reply posted!")
      setReplyText("")
      setReplyingTo(null)
      loadComments()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("[v0] Error posting reply:", errorMessage)
      toast.error("Failed to post reply")
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    setShowDeleteConfirm(commentId)
  }

  const confirmDelete = async (commentId: string) => {
    try {
      const client = supabaseAdmin || supabase
      const { error } = await client.from("post_comments").update({ is_deleted: true }).eq("id", commentId)

      if (error) throw error

      toast.success("Comment deleted")
      setShowDeleteConfirm(null)
      loadComments()
    } catch (error) {
      console.error("[v0] Error deleting comment:", error)
      toast.error("Failed to delete comment")
      setShowDeleteConfirm(null)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) {
      toast.error("Comment cannot be empty")
      return
    }

    try {
      const client = supabaseAdmin || supabase
      const { error } = await client
        .from("post_comments")
        .update({
          content: editText,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq("id", commentId)

      if (error) throw error

      toast.success("Comment updated")
      setEditingId(null)
      setEditText("")
      loadComments()
    } catch (error) {
      console.error("[v0] Error editing comment:", error)
      toast.error("Failed to edit comment")
    }
  }

  const handleAddReaction = async (commentId: string, reactionType: string) => {
    if (channelId && !isMember) {
      toast.error("You must be a member of this channel to react to comments")
      return
    }

    try {
      const client = supabaseAdmin || supabase
      const { error } = await client.from("comment_reactions").insert([
        {
          comment_id: commentId,
          user_id: currentUserId,
          reaction_type: reactionType,
        },
      ])

      if (error) throw error
      loadComments()
    } catch (error) {
      console.error("[v0] Error adding reaction:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return <div className="text-center py-4 text-gray-600">Loading comments...</div>
  }

  return (
    <div className="space-y-4">
      {/* Access Denied Message */}
      {channelId && !isMember && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Limited Access</p>
                <p className="text-sm text-amber-700">
                  You must be a member of this channel to comment, reply, or react to posts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Comment Input */}
      <Card className="border-blue-200 bg-white/90">
        <CardContent className="pt-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={isMember ? "Add a comment..." : "You must be a member to comment"}
                disabled={channelId && !isMember}
                className="border-blue-200 focus:border-blue-500"
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || (channelId && !isMember)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Post
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-center text-gray-600 py-4">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              {/* Main Comment */}
              <Card className="border-gray-200 bg-white/80">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{comment.author_name}</p>
                        <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
                        {comment.is_edited && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Edited {comment.edited_at && `• ${formatDate(comment.edited_at)}`}
                          </Badge>
                        )}
                      </div>
                      {(comment.author_id === currentUserId || isTeacher) && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(comment.id)
                              setEditText(comment.content)
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {editingId === comment.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="border-blue-200"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditComment(comment.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(null)
                              setEditText("")
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700">{comment.content}</p>
                    )}

                    {/* Reactions and Reply */}
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAddReaction(comment.id, "like")}
                        disabled={channelId && !isMember}
                        className="text-xs text-gray-600 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Heart className="h-3 w-3 mr-1" />
                        Like
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        disabled={channelId && !isMember}
                        className="text-xs text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reply Input */}
              {replyingTo === comment.id && (
                <Card className="border-blue-200 bg-blue-50 ml-4">
                  <CardContent className="pt-4">
                    <div className="flex gap-2">
                      <Input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        disabled={channelId && !isMember}
                        className="border-blue-200 focus:border-blue-500"
                      />
                      <Button
                        onClick={() => handleAddReply(comment.id)}
                        disabled={!replyText.trim() || (channelId && !isMember)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Reply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-4 space-y-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newExpanded = new Set(expandedReplies)
                      if (newExpanded.has(comment.id)) {
                        newExpanded.delete(comment.id)
                      } else {
                        newExpanded.add(comment.id)
                      }
                      setExpandedReplies(newExpanded)
                    }}
                    className="text-xs text-blue-600"
                  >
                    {expandedReplies.has(comment.id) ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Hide {comment.replies.length} replies
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show {comment.replies.length} replies
                      </>
                    )}
                  </Button>

                  {expandedReplies.has(comment.id) &&
                    comment.replies.map((reply) => (
                      <Card key={reply.id} className="border-gray-200 bg-white/60">
                        <CardContent className="pt-3">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm text-gray-800">{reply.author_name}</p>
                                <p className="text-xs text-gray-500">{formatDate(reply.created_at)}</p>
                              </div>
                              {(reply.author_id === currentUserId || isTeacher) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">{reply.content}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Custom Delete Confirmation Dialog */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <AlertDialogContent className="w-[95vw] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The comment will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteConfirm && confirmDelete(showDeleteConfirm)}
              className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
