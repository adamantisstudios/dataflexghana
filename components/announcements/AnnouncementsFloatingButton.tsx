"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAnnouncementsMemberPath } from "@/lib/announcements-channel"

/** Fixed FAB — official Announcements channel (replaces homepage WhatsApp widget). */
export function AnnouncementsFloatingButton() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
      className="fixed z-[100] pointer-events-none
        bottom-[max(1rem,env(safe-area-inset-bottom))]
        right-[max(1rem,env(safe-area-inset-right))]
        max-sm:bottom-[max(5.25rem,env(safe-area-inset-bottom))]
        max-sm:right-4"
      role="presentation"
    >
      <Button
        type="button"
        onClick={handleClick}
        className="pointer-events-auto flex h-14 items-center gap-2 rounded-full border-2 border-white bg-[#0E8F3D] px-4 text-white shadow-[0_8px_30px_rgba(0,0,0,0.25)] ring-2 ring-emerald-400/40 hover:bg-[#0a7a34] hover:shadow-xl sm:px-5"
        aria-label="Official announcements"
        title="Official announcements"
      >
        <Megaphone className="h-6 w-6 shrink-0" />
        <span className="text-sm font-semibold whitespace-nowrap max-[380px]:sr-only sm:not-sr-only">
          Announcements
        </span>
      </Button>
    </div>
  )

  if (!mounted || typeof document === "undefined") {
    return fab
  }

  return createPortal(fab, document.body)
}
