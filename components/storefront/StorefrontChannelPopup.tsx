"use client"

import { useEffect, useState } from "react"
import { X, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  storeName: string
  channelUrl: string | null | undefined
  enabled: boolean
  accentColor: string
}

export function StorefrontChannelPopup({ storeName, channelUrl, enabled, accentColor }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!enabled || !channelUrl?.trim()) return
    const t = window.setTimeout(() => setVisible(true), 3000)
    return () => window.clearTimeout(t)
  }, [enabled, channelUrl])

  if (!visible || !channelUrl?.trim()) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="Join WhatsApp channel"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Stay connected</p>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{storeName}</h2>
          </div>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="p-1 rounded-full hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-slate-600">
          Get updates, offers, and support from {storeName} on WhatsApp.
        </p>
        <Button
          asChild
          className="w-full gap-2 text-white"
          style={{ backgroundColor: accentColor }}
        >
          <a href={channelUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
            Join our WhatsApp Channel
          </a>
        </Button>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="w-full text-sm text-muted-foreground hover:text-slate-800"
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
