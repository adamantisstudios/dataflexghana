"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { DeletedItemContextMenu } from "./DeletedItemContextMenu"

interface DeletedItemDisplayProps {
  deletedAt: string
  deletedBy?: string
  onDelete: () => void
  isLoading?: boolean
  itemType?: string
  showDeleteButton?: boolean
}

export function DeletedItemDisplay({
  deletedAt,
  deletedBy,
  onDelete,
  isLoading = false,
  itemType = "item",
  showDeleteButton = true,
}: DeletedItemDisplayProps) {
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
    <DeletedItemContextMenu onDelete={onDelete} isLoading={isLoading} itemType={itemType}>
      <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-3 opacity-60 cursor-context-menu hover:opacity-75 transition-opacity">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="destructive" className="text-xs">
                Deleted
              </Badge>
              <p className="text-xs text-gray-600">
                Deleted {formatDateTime(deletedAt)}
                {deletedBy && ` by ${deletedBy}`}
              </p>
            </div>
            <p className="text-sm text-gray-700 mt-2 italic">This {itemType} has been deleted</p>
            {showDeleteButton && (
              <p className="text-xs text-gray-500 mt-2">💡 Right-click or long-press to delete permanently</p>
            )}
          </div>
          {showDeleteButton && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
              disabled={isLoading}
              className="h-7 px-2 text-xs flex-shrink-0"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </DeletedItemContextMenu>
  )
}
