"use client"

import { AgentCallWidget } from "@/components/agent-call-widget"
import { AnnouncementsFloatingButton } from "@/components/announcements/AnnouncementsFloatingButton"
import { useShouldHideStreamingChrome } from "@/lib/streaming-session"

/** Call widget + announcements FAB — hidden during live streaming. */
export function AgentFloatingChrome() {
  const hide = useShouldHideStreamingChrome()
  if (hide) return null
  return (
    <>
      <AnnouncementsFloatingButton />
      <AgentCallWidget />
    </>
  )
}
