"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MessageCircle, Send, Loader2, Trash2, Eraser } from "lucide-react"
import { toast } from "sonner"
import { useVoiceRoomChat } from "@/components/voice/useVoiceRoomChat"

type Props = {
  roomName: string
  senderName: string
  senderAgentId: string | null
  apiMode: "agent" | "admin"
  isAdmin?: boolean
  disabled?: boolean
  triggerClassName?: string
}

function formatChatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

export function ChatPanel({
  roomName,
  senderName,
  senderAgentId,
  apiMode,
  isAdmin = false,
  disabled = false,
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const listRef = useRef<HTMLDivElement>(null)

  const { messages, loading, sending, sendMessage, deleteMessage, clearChat, reload } =
    useVoiceRoomChat({
      roomName,
      senderName,
      senderAgentId,
      apiMode,
    })

  useEffect(() => {
    if (open) void reload()
  }, [open, reload])

  useEffect(() => {
    if (!open || !listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, open])

  const handleSend = async () => {
    if (!draft.trim()) return
    try {
      await sendMessage(draft)
      setDraft("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send message")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMessage(id)
      toast.success("Message removed")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    }
  }

  const handleClear = async () => {
    try {
      await clearChat()
      toast.success("Chat cleared")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Clear failed")
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={
            triggerClassName ??
            "h-14 px-4 rounded-2xl border-white/20 bg-slate-800/80 text-white hover:bg-slate-700"
          }
          aria-label="Open chat"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[60dvh] max-h-[60dvh] rounded-t-2xl flex flex-col p-0 bg-slate-900 border-white/10 text-white"
      >
        <SheetHeader className="px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-white text-base">Room chat</SheetTitle>
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 border-white/20 bg-slate-800 text-slate-100"
                  >
                    <Eraser className="h-3.5 w-3.5 mr-1" />
                    Clear all
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-white/10 text-slate-100">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Clear chat history?</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                      Removes all messages for everyone in this room.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-800 text-slate-100 border-white/20">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => void handleClear()}
                    >
                      Clear chat
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </SheetHeader>

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0"
        >
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No messages yet. Say hello!</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="group rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-emerald-300">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-500 tabular-nums">
                        {formatChatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-100 mt-1 break-words whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  </div>
                  {isAdmin && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 text-slate-400 hover:text-red-400 opacity-70 group-hover:opacity-100"
                      onClick={() => void handleDelete(msg.id)}
                      aria-label="Delete message"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <form
          className="shrink-0 px-4 py-3 border-t border-white/10 flex gap-2 safe-area-inset-bottom"
          onSubmit={(e) => {
            e.preventDefault()
            void handleSend()
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            disabled={sending || disabled}
            className="flex-1 bg-slate-800/80 border-white/20 text-white placeholder:text-slate-500"
            maxLength={2000}
          />
          <Button
            type="submit"
            disabled={sending || !draft.trim() || disabled}
            className="bg-[#0E8F3D] hover:bg-[#0a7a34] text-white shrink-0 h-10 px-4"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
