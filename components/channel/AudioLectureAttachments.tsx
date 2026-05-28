"use client"

import { FileText, FileType, ImageIcon, Paperclip } from "lucide-react"
import type { AudioAttachment } from "@/lib/channel-audio-types"
import { getAttachmentIconKind } from "@/lib/channel-audio-types"
import { cn } from "@/lib/utils"

function AttachmentIcon({ type, name }: { type: string; name: string }) {
  const kind = getAttachmentIconKind(type, name)
  const className = "h-5 w-5 text-emerald-600"
  if (kind === "pdf") return <FileType className={className} />
  if (kind === "image") return <ImageIcon className={className} />
  if (kind === "document") return <FileText className={className} />
  return <Paperclip className={className} />
}

type Props = {
  attachments: AudioAttachment[]
  className?: string
  title?: string
}

export function AudioLectureAttachments({ attachments, className, title = "Attachments" }: Props) {
  if (attachments.length === 0) return null

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {attachments.map((attachment, index) => (
          <a
            key={`${attachment.url}-${index}`}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-h-[44px] items-center gap-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 group-hover:bg-emerald-100">
              <AttachmentIcon type={attachment.type} name={attachment.name} />
            </div>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{attachment.name}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
