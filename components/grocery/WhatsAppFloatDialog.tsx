"use client"

import { useState } from "react"
import { MessageCircle, X, Send, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toWhatsAppHref } from "@/lib/phone-utils"
import { GROCERY_WHATSAPP_PHONE } from "@/lib/grocery-paystack"

const DEFAULT_MESSAGE =
  "Hello Dataflex Ghana, I want to request grocery shopping assistance."

type WhatsAppFloatDialogProps = {
  phone?: string
}

export function WhatsAppFloatDialog({ phone = GROCERY_WHATSAPP_PHONE }: WhatsAppFloatDialogProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")

  const send = () => {
    const text = message.trim() || DEFAULT_MESSAGE
    const href = toWhatsAppHref(phone, text)
    if (!href || href === "#") return
    window.open(href, "_blank", "noopener,noreferrer")
    setMessage("")
    setOpen(false)
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-4 sm:p-6"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 bg-white overflow-hidden animate-in zoom-in-95 fade-in duration-200"
            role="dialog"
            aria-labelledby="whatsapp-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-4 bg-gradient-to-r from-[#0E8F3D] to-[#35B24A] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 id="whatsapp-dialog-title" className="font-semibold text-base truncate">
                    Chat with Dataflex Ghana
                  </h2>
                  <p className="text-xs text-white/90">We typically reply on WhatsApp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-600">
                Type your message below. We&apos;ll open WhatsApp with your text ready to send.
              </p>
              <Textarea
                rows={4}
                placeholder="How can we help with your grocery order?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-xl resize-none"
              />
              <Button
                type="button"
                onClick={send}
                className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white gap-2"
              >
                <Send className="h-4 w-4" />
                Send via WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
        aria-label="Open WhatsApp chat"
      >
        <MessageCircle className="h-7 w-7" />
      </button>
    </>
  )
}
