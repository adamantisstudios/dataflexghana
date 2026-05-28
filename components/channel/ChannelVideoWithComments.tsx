"use client"

import { useState } from "react"
import { MessageCircle } from "lucide-react"
import { VideoCommentPanel } from "./VideoCommentPanel"

interface ChannelVideoWithCommentsProps {
  videoId: string
  source?: "upload" | "embed"
  children: React.ReactNode
  className?: string
}

export function ChannelVideoWithComments({
  videoId,
  source = "upload",
  children,
  className = "",
}: ChannelVideoWithCommentsProps) {
  const [commentsOpen, setCommentsOpen] = useState(false)

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className}`}>
      <div
        className={`relative transition-all duration-300 ease-out ${commentsOpen ? "h-[40%] min-h-[200px] shrink-0" : "flex-1"}`}
      >
        <div className="h-full w-full">{children}</div>
        <button
          type="button"
          onClick={() => setCommentsOpen(true)}
          className="absolute bottom-3 right-3 z-20 flex flex-col items-center gap-0.5 text-white/90 transition-colors hover:text-white"
          aria-label="Open comments"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm shadow-md">
            <MessageCircle className="h-5 w-5" />
          </span>
          <span className="text-[10px] font-medium drop-shadow">Comments</span>
        </button>
        {commentsOpen && (
          <button
            type="button"
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label="Close comments"
            onClick={() => setCommentsOpen(false)}
          />
        )}
      </div>
      <div
        className={`shrink-0 overflow-hidden border-t border-gray-100 transition-all duration-300 ease-out ${
          commentsOpen ? "h-[60%] min-h-[240px]" : "h-0"
        }`}
      >
        <VideoCommentPanel
          videoId={videoId}
          source={source}
          isOpen={commentsOpen}
          onClose={() => setCommentsOpen(false)}
        />
      </div>
    </div>
  )
}
