"use client"
import { useState } from "react"
import type React from "react"

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeletedItemContextMenuProps {
  children: React.ReactNode
  onDelete: () => void
  isLoading?: boolean
  itemType?: string
}

export function DeletedItemContextMenu({
  children,
  onDelete,
  isLoading = false,
  itemType = "item",
}: DeletedItemContextMenuProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = () => {
    onDelete()
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-red-600 cursor-pointer">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {itemType}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Delete {itemType}?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600">
              This {itemType} will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end pt-2">
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 text-white border-0"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
