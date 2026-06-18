"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Sparkles } from "lucide-react"

const storageKey = (agentId: string) => `referralhub-earnings-tip-dismissed-${agentId}`

interface Props {
  agentId: string
  onLearnMore: () => void
}

export function ReferralHubEarningsTip({ agentId, onLearnMore }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!agentId) return
    try {
      const dismissed = localStorage.getItem(storageKey(agentId))
      if (!dismissed) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [agentId])

  useEffect(() => {
    if (!visible) return
    const timer = window.setTimeout(() => setVisible(false), 5000)
    return () => window.clearTimeout(timer)
  }, [visible])

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey(agentId), "1")
    } catch {
      /* ignore */
    }
    setVisible(false)
  }

  const handleLearnMore = () => {
    onLearnMore()
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:pb-6 pointer-events-none"
      role="dialog"
      aria-live="polite"
      aria-label="Earnings tip"
    >
      <div
        className="pointer-events-auto max-w-lg mx-auto rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-emerald-50 shadow-2xl shadow-amber-900/10 overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-500"
      >
        <div className="flex gap-3 p-4 sm:p-5">
          <div
            className="h-10 w-10 shrink-0 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-700"
            aria-hidden
          >
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 pr-6 relative">
            <button
              type="button"
              onClick={dismiss}
              className="absolute top-0 right-0 p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-sm sm:text-[15px] text-slate-800 leading-snug font-medium">
              💡 Boost your earnings! Turn on high‑paying referral services and earn bigger
              commissions. Explore them now in the Marketplace tab.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
              onClick={handleLearnMore}
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
