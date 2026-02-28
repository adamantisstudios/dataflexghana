"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Eye, MessageSquare, Pin, Clock } from "lucide-react"
import { MathRenderer } from "./media/MathRenderer"
import { CodeBlockRenderer } from "./media/CodeBlockRenderer"

interface ContentCardProps {
  id: string
  title: string
  content: string
  type: "lesson" | "announcement" | "resource" | "discussion" | "shared"
  author?: string
  createdAt: string
  viewCount?: number
  commentCount?: number
  isPinned?: boolean
  onDelete: () => void
  onPin?: () => void
  isDeleting?: boolean
  children?: React.ReactNode
}

export function ContentCard({
  id,
  title,
  content,
  type,
  author,
  createdAt,
  viewCount = 0,
  commentCount = 0,
  isPinned = false,
  onDelete,
  onPin,
  isDeleting = false,
  children,
}: ContentCardProps) {
  const typeColors = {
    lesson: "bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500",
    announcement: "bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-amber-500",
    resource: "bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500",
    discussion: "bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-500",
    shared: "bg-gradient-to-r from-indigo-50 to-indigo-100 border-l-4 border-indigo-500",
  }

  const typeBadgeColors = {
    lesson: "bg-blue-200 text-blue-800",
    announcement: "bg-amber-200 text-amber-800",
    resource: "bg-green-200 text-green-800",
    discussion: "bg-purple-200 text-purple-800",
    shared: "bg-indigo-200 text-indigo-800",
  }

  const renderContent = (text: string) => {
    if (text.includes("\\(") || text.includes("\\[") || text.includes("$$")) {
      return <MathRenderer content={text} />
    }

    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const matches = Array.from(text.matchAll(codeBlockRegex))

    if (matches.length > 0) {
      return (
        <div className="space-y-3">
          {text.split(codeBlockRegex).map((part, idx) => {
            if (idx % 3 === 0) {
              return part.trim() ? (
                <p key={idx} className="text-gray-700 text-sm break-words whitespace-pre-wrap leading-relaxed">
                  {part}
                </p>
              ) : null
            } else if (idx % 3 === 1) {
              return null
            } else {
              const language =
                text.match(codeBlockRegex)?.[Math.floor(idx / 3)]?.match(/```(\w+)?/)?.[1] || "javascript"
              return <CodeBlockRenderer key={idx} code={part.trim()} language={language} />
            }
          })}
        </div>
      )
    }

    return <p className="text-gray-700 text-sm break-words whitespace-pre-wrap leading-relaxed">{content}</p>
  }

  return (
    <div className={`rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300 ${typeColors[type]}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className={typeBadgeColors[type]}>{type}</Badge>
            {isPinned && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Pin className="h-3 w-3 mr-1" />
                Pinned
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900 break-words">{title}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-600 mt-2 flex-wrap">
            <Clock className="h-3 w-3" />
            <span>{new Date(createdAt).toLocaleDateString()}</span>
            {author && <span className="text-gray-500">by {author}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onPin && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onPin}
              className="hover:bg-white/50"
              title={isPinned ? "Unpin" : "Pin"}
            >
              <Pin className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={onDelete} disabled={isDeleting} className="hover:bg-red-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-4">{renderContent(content)}</div>

      {children && <div className="mb-4 border-t border-gray-300 pt-4">{children}</div>}

      <div className="flex items-center gap-6 text-xs text-gray-600 pt-4 border-t border-gray-300">
        <span className="flex items-center gap-1 hover:text-gray-900 transition-colors">
          <Eye className="h-4 w-4" />
          {viewCount} views
        </span>
        <span className="flex items-center gap-1 hover:text-gray-900 transition-colors">
          <MessageSquare className="h-4 w-4" />
          {commentCount} comments
        </span>
      </div>
    </div>
  )
}
