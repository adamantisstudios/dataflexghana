"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { realtimeManager } from "@/lib/realtime-manager"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

export type CallWidgetPhase =
  | "idle"
  | "calling"
  | "in_call"
  | "declined"
  | "busy_wait"

export type CallSession = {
  id: string
  caller_id: string
  receiver_id: string
  livekit_room_name: string
  status: string
  created_at: string
  ended_at?: string | null
  agents?: {
    full_name?: string | null
    agent_name?: string | null
    phone_number?: string | null
  } | null
}

type UseCallWidgetOptions = {
  role: "agent" | "admin"
  userId: string
}

function formatCallDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function useCallWidget({ role, userId }: UseCallWidgetOptions) {
  const [phase, setPhase] = useState<CallWidgetPhase>("idle")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [adminAvailable, setAdminAvailable] = useState(true)
  const [busyCountdown, setBusyCountdown] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [roomName, setRoomName] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null)
  const [callerName, setCallerName] = useState("Agent")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  const clearPoll = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
  }, [])

  const endCall = useCallback(
    async (id?: string | null) => {
      const sid = id ?? sessionIdRef.current
      clearPoll()
      if (sid) {
        const headers =
          role === "agent"
            ? getAgentAuthHeaders()
            : { "Content-Type": "application/json", ...getAdminAuthHeaders() }
        try {
          await fetch("/api/calls/end", {
            method: "POST",
            headers,
            body: JSON.stringify({ sessionId: sid }),
          })
        } catch {
          /* best effort */
        }
      }
      setPhase("idle")
      setSessionId(null)
      setRoomName(null)
      setToken(null)
      setServerUrl(null)
      setIncomingCall(null)
      sessionIdRef.current = null
    },
    [role, clearPoll],
  )

  const refreshAvailability = useCallback(async () => {
    if (role !== "agent") return
    try {
      const res = await fetch("/api/calls/availability", {
        headers: getAgentAuthHeaders(),
        credentials: "same-origin",
      })
      const data = await res.json()
      setAdminAvailable(data.available !== false)
    } catch {
      setAdminAvailable(true)
    }
  }, [role])

  const pollAgentSession = useCallback(
    (sid: string) => {
      clearPoll()
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/calls/initiate?sessionId=${encodeURIComponent(sid)}`,
            { headers: getAgentAuthHeaders(), credentials: "same-origin" },
          )
          const data = await res.json()
          const status = data.session?.status as string | undefined
          if (status === "active") {
            clearPoll()
            setPhase("in_call")
          } else if (status === "declined") {
            clearPoll()
            setPhase("declined")
          } else if (status === "ended") {
            clearPoll()
            void endCall(sid)
          }
        } catch {
          /* ignore transient poll errors */
        }
      }, 2000)
    },
    [clearPoll, endCall],
  )

  const initiateCall = useCallback(async () => {
    if (role !== "agent") return
    setPhase("calling")
    try {
      const res = await fetch("/api/calls/initiate", {
        method: "POST",
        headers: getAgentAuthHeaders(),
        credentials: "same-origin",
      })
      const data = await res.json()

      if (res.status === 409 && data.busy) {
        setPhase("busy_wait")
        setBusyCountdown(60)
        return
      }

      if (!res.ok) throw new Error(data.error || "Could not start call")

      setSessionId(data.sessionId)
      sessionIdRef.current = data.sessionId
      setRoomName(data.roomName)
      setToken(data.token)
      setServerUrl(data.serverUrl)
      pollAgentSession(data.sessionId)
    } catch (e) {
      setPhase("idle")
      throw e
    }
  }, [role, pollAgentSession])

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return
    const res = await fetch("/api/calls/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
      body: JSON.stringify({ sessionId: incomingCall.id, action: "accept" }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Could not accept call")

    setSessionId(incomingCall.id)
    sessionIdRef.current = incomingCall.id
    setRoomName(data.roomName)
    setToken(data.token)
    setServerUrl(data.serverUrl)
    setIncomingCall(null)
    setPhase("in_call")
  }, [incomingCall])

  const declineCall = useCallback(async () => {
    if (!incomingCall) return
    await fetch("/api/calls/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
      body: JSON.stringify({ sessionId: incomingCall.id, action: "decline" }),
    })
    setIncomingCall(null)
    setPhase("idle")
  }, [incomingCall])

  const loadAdminIncoming = useCallback(async () => {
    if (role !== "admin" || !userId) return
    try {
      const res = await fetch("/api/calls/incoming", {
        headers: getAdminAuthHeaders(),
        credentials: "same-origin",
      })
      const data = await res.json()
      if (data.active && phase !== "in_call") {
        setIncomingCall(null)
      }
      if (data.ringing && phase === "idle") {
        setIncomingCall(data.ringing as CallSession)
        const agent = data.ringing.agents
        const name = agent?.full_name || agent?.agent_name || "Agent"
        setCallerName(String(name))
      }
    } catch {
      /* ignore */
    }
  }, [role, userId, phase])

  useEffect(() => {
    void refreshAvailability()
  }, [refreshAvailability])

  useEffect(() => {
    if (phase !== "busy_wait" || busyCountdown <= 0) return
    const t = setTimeout(() => setBusyCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, busyCountdown])

  useEffect(() => {
    if (phase === "busy_wait" && busyCountdown === 0) {
      setPhase("idle")
      void refreshAvailability()
    }
  }, [phase, busyCountdown, refreshAvailability])

  useEffect(() => {
    if (role !== "admin" || !userId) return
    void loadAdminIncoming()

    const unsubscribe = realtimeManager.subscribe(
      `call_sessions_admin_${userId}`,
      "call_sessions",
      (payload: RealtimePostgresChangesPayload<CallSession>) => {
        const row = (payload.new || payload.old) as CallSession | undefined
        if (!row) return
        if (row.receiver_id !== userId) return

        if (payload.eventType === "INSERT" && row.status === "ringing") {
          setIncomingCall(row)
          void loadAdminIncoming()
        }
        if (payload.eventType === "UPDATE") {
          if (row.status === "ringing" && phase === "idle") {
            setIncomingCall(row)
            void loadAdminIncoming()
          }
          if (row.status === "ended" || row.status === "declined") {
            if (sessionIdRef.current === row.id && phase === "in_call") {
              void endCall(row.id)
            }
            if (incomingCall?.id === row.id) setIncomingCall(null)
          }
        }
      },
      `receiver_id=eq.${userId}`,
    )

    return () => unsubscribe()
  }, [role, userId, loadAdminIncoming, phase, incomingCall?.id, endCall])

  useEffect(() => {
    return () => {
      clearPoll()
      if (sessionIdRef.current) {
        void endCall(sessionIdRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup on unmount only
  }, [])

  const hasIncoming = Boolean(incomingCall)

  return {
    phase,
    dialogOpen,
    setDialogOpen,
    adminAvailable,
    busyCountdown,
    sessionId,
    roomName,
    token,
    serverUrl,
    incomingCall,
    callerName,
    hasIncoming,
    formatCallDuration,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    refreshAvailability,
  }
}
