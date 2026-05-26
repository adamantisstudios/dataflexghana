"use client"

import { supabase } from "@/lib/supabase-base"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

/**
 * Subscribe to call_sessions postgres_changes without the session gate used by
 * realtime-manager (admin/agent auth is custom, not Supabase Auth).
 */
export function subscribeCallSessions<T extends Record<string, unknown>>(
  channelKey: string,
  filter: string,
  onPayload: (payload: RealtimePostgresChangesPayload<T>) => void,
): () => void {
  const channelName = `call_sessions_${channelKey}_${Date.now()}`
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "call_sessions",
        filter,
      },
      onPayload,
    )
    .subscribe((status, err) => {
      if (status === "CHANNEL_ERROR") {
        console.error("[call-realtime] channel error:", err ?? "unknown")
      } else if (status === "TIMED_OUT") {
        console.warn("[call-realtime] channel timed out:", channelName)
      }
    })

  return () => {
    void supabase.removeChannel(channel)
  }
}
