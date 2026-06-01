"use client"

import { AgentCallWidget } from "@/components/agent-call-widget"
import { useShouldHideStreamingChrome } from "@/lib/streaming-session"

/** Voice support call FAB — hidden during tutorials, channels, and live streaming. */
export function AgentFloatingChrome() {
  const hide = useShouldHideStreamingChrome()
  if (hide) return null
  return <AgentCallWidget />
}
