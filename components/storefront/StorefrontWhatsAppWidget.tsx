"use client"

import { useState } from "react"
import { MessageCircle, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toWhatsAppHref } from "@/lib/phone-utils"

interface StorefrontWhatsAppWidgetProps {
  whatsappPhone: string | null
  storeName: string
  accentColor: string
}

export function StorefrontWhatsAppWidget({
  whatsappPhone,
  storeName,
  accentColor,
}: StorefrontWhatsAppWidgetProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")

  const send = () => {
    const text =
      message.trim() ||
      `Hi, I'm visiting ${storeName || "your store"} and would like more information.`
    const href = toWhatsAppHref(whatsappPhone, text)
    if (!href || href === "#") return
    window.open(href, "_blank", "noopener,noreferrer")
    setMessage("")
    setOpen(false)
  }

  if (!whatsappPhone) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-[min(100vw-2rem,320px)] rounded-2xl shadow-2xl border border-slate-200 bg-white overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
          role="dialog"
          aria-label="WhatsApp chat"
        >
          <div
            className="px-4 py-3 text-white flex items-center justify-between"
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, #25D366 100%)`,
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <MessageCircle className="h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">Chat with store</p>
                <p className="text-xs text-white/90 truncate">{storeName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-3 space-y-3">
            <p className="text-xs text-slate-600">
              Type your message and we&apos;ll open WhatsApp so you can send it to the agent.
            </p>
            <Input
              placeholder="Your message…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="text-sm"
            />
            <Button
              type="button"
              className="w-full text-white gap-2"
              style={{ backgroundColor: accentColor }}
              onClick={send}
            >
              <Send className="h-4 w-4" />
              Send on WhatsApp
            </Button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 ring-4 ring-white"
        style={{
          background: `linear-gradient(145deg, #25D366 30%, ${accentColor} 100%)`,
        }}
        aria-label={open ? "Close WhatsApp chat" : "Open WhatsApp chat"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
      </button>
    </div>
  )
}
