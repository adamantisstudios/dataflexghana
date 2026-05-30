"use client"

import { AdminCallWidget } from "@/components/admin-call-widget"
import { useShouldHideStreamingChrome } from "@/lib/streaming-session"

/** Admin support call widget — hidden during live streaming. */
export function AdminFloatingChrome() {
  const hide = useShouldHideStreamingChrome()
  if (hide) return null
  return <AdminCallWidget />
}
