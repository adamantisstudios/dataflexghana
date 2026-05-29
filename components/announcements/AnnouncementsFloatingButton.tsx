"use client"

import { useRouter } from "next/navigation"
import { Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAnnouncementsChannelIdFromEnv } from "@/lib/announcements-channel"

/** Homepage floating button — opens official Announcements channel (replaces WhatsApp widget). */
export function AnnouncementsFloatingButton() {
  const router = useRouter()
  const channelId = getAnnouncementsChannelIdFromEnv()

  const handleClick = () => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("agent")
    if (!stored) {
      router.push("/agent/login")
      return
    }
    try {
      const agent = JSON.parse(stored) as { id?: string }
      if (!agent?.id) {
        router.push("/agent/login")
        return
      }
      router.push(`/agent/teaching/${channelId}/member`)
    } catch {
      router.push("/agent/login")
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 pointer-events-none">
      <div className="pointer-events-auto">
        <Button
          type="button"
          onClick={handleClick}
          className="h-14 w-14 rounded-full bg-[#0E8F3D] p-0 text-white shadow-lg hover:bg-[#0a7a34] border-2 border-white"
          aria-label="Official announcements"
          title="Official announcements"
        >
          <Megaphone className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}
