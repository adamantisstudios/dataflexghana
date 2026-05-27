"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  SECURITY_NOTICE_MESSAGE,
  canShowSecurityNoticeToday,
  recordSecurityNoticeShown,
  FOOTER_SECURITY_LINE,
} from "@/lib/security-notice"

export function SecurityNoticeLogin() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (canShowSecurityNoticeToday()) {
      recordSecurityNoticeShown()
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-amber-950 shadow-sm"
    >
      <div className="flex gap-2">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <p className="font-semibold mb-1">Security Notice</p>
          <p>{SECURITY_NOTICE_MESSAGE}</p>
        </div>
      </div>
    </div>
  )
}

export function SecurityNoticeBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (canShowSecurityNoticeToday()) {
      recordSecurityNoticeShown()
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 shadow-md"
    >
      <div className="flex gap-3 items-start">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
        <div className="flex-1 min-w-0 text-sm text-amber-950 leading-relaxed">
          <p className="font-semibold mb-1">Security Notice</p>
          <p>{SECURITY_NOTICE_MESSAGE}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 text-amber-800 hover:bg-amber-100"
          aria-label="Dismiss security notice"
          onClick={() => setVisible(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          size="sm"
          className="bg-amber-700 hover:bg-amber-800 text-white"
          onClick={() => setVisible(false)}
        >
          I understand
        </Button>
      </div>
    </div>
  )
}

export function SecurityNoticeFooter() {
  return (
    <div className="mt-6 rounded-lg border border-amber-800/40 bg-amber-950/30 px-4 py-3">
      <div className="flex gap-2 items-start text-amber-100/90 text-xs sm:text-sm leading-relaxed">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <p className="font-medium text-amber-200 mb-1">Security Notice</p>
          <p>{SECURITY_NOTICE_MESSAGE}</p>
          <p className="mt-2 text-amber-300/80">{FOOTER_SECURITY_LINE}</p>
        </div>
      </div>
    </div>
  )
}

export function LegalFooterLinks({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground ${className}`}
    >
      <Link href="/terms" className="hover:text-emerald-600 underline-offset-2 hover:underline">
        Terms & Conditions
      </Link>
      <span className="text-gray-300">|</span>
      <Link href="/faq" className="hover:text-emerald-600 underline-offset-2 hover:underline">
        FAQ
      </Link>
      <span className="hidden sm:inline text-gray-300">|</span>
      <span className="hidden sm:inline text-gray-500">{FOOTER_SECURITY_LINE}</span>
    </div>
  )
}
