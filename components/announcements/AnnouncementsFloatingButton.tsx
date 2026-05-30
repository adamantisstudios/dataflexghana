"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { useShouldHideStreamingChrome } from "@/lib/streaming-session"
import { Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAnnouncementsMemberPath } from "@/lib/announcements-channel"

/** Fixed FAB — official Announcements channel (replaces homepage WhatsApp widget). */
export function AnnouncementsFloatingButton() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const hideOnStreaming = useShouldHideStreamingChrome()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (hideOnStreaming) {
    return null
  }

  const handleClick = () => {
    const memberPath = getAnnouncementsMemberPath()
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("agent")
    if (!stored) {
      router.push(`/agent/login?redirect=${encodeURIComponent(memberPath)}`)
      return
    }
    try {
      const agent = JSON.parse(stored) as { id?: string }
      if (!agent?.id) {
        router.push(`/agent/login?redirect=${encodeURIComponent(memberPath)}`)
        return
      }
      router.push(memberPath)
    } catch {
      router.push(`/agent/login?redirect=${encodeURIComponent(memberPath)}`)
    }
  }

  const fab = (
    <div
      className="fixed z-[52] pointer-events-none
        bottom-[max(6rem,calc(6rem+env(safe-area-inset-bottom)))]
        right-[max(1.5rem,calc(1.5rem+env(safe-area-inset-right)))]
        max-sm:bottom-[max(7rem,calc(7rem+env(safe-area-inset-bottom)))]
        max-sm:right-[max(1rem,calc(1rem+env(safe-area-inset-right)))]"
      role="presentation"
    >
      <Button
        type="button"
        onClick={handleClick}
        size="icon"
        className="pointer-events-auto h-11 w-11 rounded-full border border-white/80 bg-[#0E8F3D] text-white shadow-md transition-transform duration-150 hover:bg-[#0a7a34] hover:scale-105 active:scale-95"
        aria-label="Official announcements"
        title="Official announcements"
      >
        <Megaphone className="h-5 w-5" />
      </Button>
    </div>
  )

  if (!mounted || typeof document === "undefined") {
    return fab
  }

  return createPortal(fab, document.body)
}
