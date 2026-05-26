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
  const phaseRef = useRef<CallWidgetPhase>("idle")
  const intentionalEndRef = useRef(false)

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const clearPoll = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
  }, [])

  const resetLocalState = useCallback(() => {
    setPhase("idle")
    setSessionId(null)
    setRoomName(null)
    setToken(null)
    setServerUrl(null)
    setIncomingCall(null)
    sessionIdRef.current = null
  }, [])

  const endCall = useCallback(
    async (id?: string | null, intentional = true) => {
      const sid = id ?? sessionIdRef.current
      clearPoll()
      if (intentional) intentionalEndRef.current = true

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
      resetLocalState()
    },
    [role, clearPoll, resetLocalState],
  )

  const handleRemoteEnded = useCallback(
    (status: string) => {
      if (intentionalEndRef.current) return
      clearPoll()
      if (status === "declined") {
        setPhase("declined")
        setToken(null)
        setServerUrl(null)
        return
      }
      resetLocalState()
    },
    [clearPoll, resetLocalState],
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
            setDialogOpen(true)
          } else if (status === "declined") {
            clearPoll()
            handleRemoteEnded("declined")
          } else if (status === "ended") {
            clearPoll()
            handleRemoteEnded("ended")
          }
        } catch {
          /* ignore transient poll errors */
        }
      }, 1500)
    },
    [clearPoll, handleRemoteEnded],
  )

  const initiateCall = useCallback(async () => {
    if (role !== "agent") return
    intentionalEndRef.current = false
    setPhase("calling")
    setDialogOpen(true)
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
    intentionalEndRef.current = false
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
    setDialogOpen(true)
  }, [incomingCall])

  const declineCall = useCallback(async () => {
    if (!incomingCall) return
    intentionalEndRef.current = true
    await fetch("/api/calls/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
      body: JSON.stringify({ sessionId: incomingCall.id, action: "decline" }),
    })
    setIncomingCall(null)
    resetLocalState()
  }, [incomingCall, resetLocalState])

  const loadAdminIncoming = useCallback(async () => {
    if (role !== "admin" || !userId) return
    try {
      const res = await fetch("/api/calls/incoming", {
        headers: getAdminAuthHeaders(),
        credentials: "same-origin",
      })
      const data = await res.json()
      if (data.ringing && phaseRef.current === "idle") {
        setIncomingCall(data.ringing as CallSession)
        const agent = data.ringing.agents
        const name = agent?.full_name || agent?.agent_name || "Agent"
        setCallerName(String(name))
      }
      if (data.active && phaseRef.current === "idle") {
        setIncomingCall(null)
      }
    } catch {
      /* ignore */
    }
  }, [role, userId])

  const applySessionUpdate = useCallback(
    (row: CallSession) => {
      if (row.status === "active") {
        if (role === "agent" && row.caller_id === userId) {
          clearPoll()
          setSessionId(row.id)
          sessionIdRef.current = row.id
          setPhase("in_call")
          setDialogOpen(true)
        }
        if (role === "admin" && row.receiver_id === userId && phaseRef.current === "idle") {
          setIncomingCall(null)
        }
        return
      }
      if (row.status === "declined" || row.status === "ended") {
        if (sessionIdRef.current === row.id) {
          handleRemoteEnded(row.status)
        }
        if (incomingCall?.id === row.id) {
          setIncomingCall(null)
        }
      }
    },
    [role, userId, clearPoll, handleRemoteEnded, incomingCall?.id],
  )

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

  // Admin realtime: incoming + session status
  useEffect(() => {
    if (role !== "admin" || !userId) return
    void loadAdminIncoming()

    const unsubscribe = realtimeManager.subscribe(
      `call_sessions_admin_${userId}`,
      "call_sessions",
      (payload: RealtimePostgresChangesPayload<CallSession>) => {
        const row = (payload.new || payload.old) as CallSession | undefined
        if (!row || row.receiver_id !== userId) return
        if (payload.eventType === "INSERT" && row.status === "ringing") {
          setIncomingCall(row)
          void loadAdminIncoming()
        }
        if (payload.eventType === "UPDATE") {
          applySessionUpdate(row)
        }
      },
      `receiver_id=eq.${userId}`,
    )

    return () => unsubscribe()
  }, [role, userId, loadAdminIncoming, applySessionUpdate])

  // Agent realtime: accept/decline/end without waiting for poll
  useEffect(() => {
    if (role !== "agent" || !userId) return

    const unsubscribe = realtimeManager.subscribe(
      `call_sessions_agent_${userId}`,
      "call_sessions",
      (payload: RealtimePostgresChangesPayload<CallSession>) => {
        const row = (payload.new || payload.old) as CallSession | undefined
        if (!row || row.caller_id !== userId) return
        if (payload.eventType === "UPDATE") {
          applySessionUpdate(row)
        }
      },
      `caller_id=eq.${userId}`,
    )

    return () => unsubscribe()
  }, [role, userId, applySessionUpdate])

  // Tab close: end active call (keepalive fetch includes auth headers)
  useEffect(() => {
    const onBeforeUnload = () => {
      const sid = sessionIdRef.current
      if (!sid || phaseRef.current !== "in_call") return
      const headers =
        role === "agent"
          ? getAgentAuthHeaders()
          : { "Content-Type": "application/json", ...getAdminAuthHeaders() }
      void fetch("/api/calls/end", {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId: sid }),
        keepalive: true,
      })
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [role])

  const hasIncoming = Boolean(incomingCall)
  const liveKitActive =
    Boolean(token && serverUrl && sessionId) &&
    (phase === "calling" || phase === "in_call")

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
    liveKitActive,
    formatCallDuration,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    refreshAvailability,
  }
}
