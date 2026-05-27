"use client"

import { supabase } from "@/lib/supabase-base"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

const INIT_DELAY_MS = 500

let subscribeCounter = 0

type SubscribeRole = "admin" | "agent"

type SubscribeCallSessionsOptions<T extends Record<string, unknown>> = {
  channelKey: string
  role: SubscribeRole
  userId: string
  onPayload: (payload: RealtimePostgresChangesPayload<T>) => void
}

/**
 * Subscribe to call_sessions postgres_changes without the session gate used by
 * realtime-manager (admin/agent auth is custom, not Supabase Auth).
 *
 * Requires `scripts/077_call_sessions_realtime_rls.sql` in Supabase SQL Editor.
 */
export function subscribeCallSessions<T extends Record<string, unknown>>({
  channelKey,
  role,
  userId,
  onPayload,
}: SubscribeCallSessionsOptions<T>): () => void {
  const channelName = `call_sessions_${channelKey}_${++subscribeCounter}_${Date.now()}`
  let channel: RealtimeChannel | null = null
  let cancelled = false

  const timer = setTimeout(() => {
    if (cancelled) return
    if (!userId.trim()) {
      console.warn("[call-realtime] skipped subscription: missing userId", channelName)
      return
    }

    const identityFilter = role === "admin" ? `receiver_id=eq.${userId}` : `caller_id=eq.${userId}`

    try {
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "call_sessions",
            filter: identityFilter,
          },
          (payload) => {
            const row = payload.new as { status?: string } | undefined
            if (row?.status === "ringing") {
              onPayload(payload as RealtimePostgresChangesPayload<T>)
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "call_sessions",
            filter: identityFilter,
          },
          (payload) => {
            onPayload(payload as RealtimePostgresChangesPayload<T>)
          },
        )
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") {
            return
          }
          if (status === "CHANNEL_ERROR") {
            console.warn("[call-realtime] channel error:", channelName, err ?? "unknown")
          } else if (status === "TIMED_OUT") {
            console.warn("[call-realtime] channel timed out:", channelName)
          } else if (status === "CLOSED") {
            console.warn("[call-realtime] channel closed:", channelName)
          }
        })
    } catch (error) {
      console.warn(
        "[call-realtime] subscribe failed:",
        channelName,
        error instanceof Error ? error.message : error,
      )
    }
  }, INIT_DELAY_MS)

  return () => {
    cancelled = true
    clearTimeout(timer)
    if (channel) {
      void supabase.removeChannel(channel)
      channel = null
    }
  }
}
