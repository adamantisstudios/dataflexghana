"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { DeletedItemContextMenu } from "./DeletedItemContextMenu"

interface PostDeletedStateProps {
  deletedAt: string
  onPermanentlyDelete: () => void
  isLoading?: boolean
}

export function PostDeletedState({ deletedAt, onPermanentlyDelete, isLoading = false }: PostDeletedStateProps) {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <DeletedItemContextMenu onDelete={onPermanentlyDelete} isLoading={isLoading} itemType="post">
      <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 opacity-60 cursor-context-menu hover:opacity-75 transition-opacity">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="destructive" className="text-xs">
                Deleted
              </Badge>
              <p className="text-xs text-gray-600">Deleted {formatDateTime(deletedAt)}</p>
            </div>
            <p className="text-sm text-gray-700 italic">This post has been deleted</p>
            <p className="text-xs text-gray-500 mt-2">💡 Right-click or long-press to permanently delete</p>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={onPermanentlyDelete}
            disabled={isLoading}
            className="h-8 px-2 text-xs flex-shrink-0"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </DeletedItemContextMenu>
  )
}
