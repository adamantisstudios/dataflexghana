"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, MessageCircle, Pin } from "lucide-react"
import { CommentThread } from "./CommentThread"

interface PostCardProps {
  id: string
  title: string
  content: string
  author_name: string
  post_type: "lesson" | "announcement" | "resource" | "discussion"
  view_count: number
  comment_count?: number
  is_pinned?: boolean
  created_at: string
  currentUserId: string
  currentUserName: string
  isTeacher?: boolean
}

export function PostCard({
  id,
  title,
  content,
  author_name,
  post_type,
  view_count,
  comment_count = 0,
  is_pinned = false,
  created_at,
  currentUserId,
  currentUserName,
  isTeacher = false,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false)

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "lesson":
        return "bg-blue-100 text-blue-800"
      case "announcement":
        return "bg-red-100 text-red-800"
      case "resource":
        return "bg-green-100 text-green-800"
      case "discussion":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Card className="border-blue-200 bg-white/90 hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {is_pinned && (
              <div className="flex items-center gap-1 mb-2">
                <Pin className="h-3 w-3 text-amber-600" />
                <span className="text-xs text-amber-600 font-medium">Pinned</span>
              </div>
            )}
            <CardTitle className="text-lg text-blue-800">{title}</CardTitle>
            <p className="text-xs text-gray-600 mt-1">
              by {author_name} • {formatDate(created_at)}
            </p>
          </div>
          <Badge className={getPostTypeColor()}>{post_type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-gray-700 line-clamp-3">{content}</p>

        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {view_count} views
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {comment_count} comments
          </span>
        </div>

        <Dialog open={showComments} onOpenChange={setShowComments}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <MessageCircle className="h-4 w-4 mr-2" />
              View & Comment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-700">{content}</p>
                <p className="text-xs text-gray-600 mt-2">
                  by {author_name} • {formatDate(created_at)}
                </p>
              </div>
              <CommentThread
                postId={id}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                isTeacher={isTeacher}
              />
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
