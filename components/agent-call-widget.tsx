"use client"

import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Clock,
  Headphones,
  Loader2,
  Phone,
  PhoneOff,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { getStoredAgent } from "@/lib/unified-auth-system"
import { useCallWidget } from "@/hooks/use-call-widget"
import { isStreamingPagePath } from "@/lib/streaming-routes"
import { CallAudioSession, useCallAudioControls } from "@/components/calls/CallAudioSession"
import { CallMuteButton } from "@/components/calls/CallLiveKitAudio"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

function AgentCallDialogUI({
  phase,
  adminAvailable,
  busyCountdown,
  starting,
  onCallSupport,
  onRefresh,
  onEndCall,
  formatCallDuration,
}: {
  phase: string
  adminAvailable: boolean
  busyCountdown: number
  starting: boolean
  onCallSupport: () => void
  onRefresh: () => void | Promise<void>
  onEndCall: () => void
  formatCallDuration: (s: number) => string
}) {
  const controls = useCallAudioControls()
  const elapsed = controls?.elapsed ?? 0

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
        <User className="h-8 w-8 text-slate-500" />
      </div>
      <p className="text-sm text-muted-foreground text-center">
        {phase === "in_call"
          ? controls?.connected
            ? "Connected to support"
            : "Connecting…"
          : adminAvailable
            ? "Admin is available"
            : "Admin is on a call"}
      </p>

      {phase === "idle" && (
        <button
          type="button"
          disabled={starting || !adminAvailable}
          onClick={() => void onCallSupport()}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
          Call Support
        </button>
      )}

      {phase === "calling" && (
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
            <Phone className="h-8 w-8 text-emerald-600" />
          </div>
          <p className="font-medium text-emerald-700 dark:text-emerald-400">Calling…</p>
          <p className="text-xs text-muted-foreground">Waiting for admin to answer</p>
          <button
            type="button"
            onClick={onEndCall}
            className="mt-1 h-11 px-5 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium flex items-center gap-2"
          >
            <PhoneOff className="h-4 w-4" />
            Cancel
          </button>
        </div>
      )}

      {phase === "busy_wait" && (
        <div className="text-center space-y-3 w-full">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Admin is on another call. Please wait…
          </p>
          <p className="text-4xl font-bold tabular-nums">{busyCountdown}</p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" /> seconds until you can try again
          </p>
        </div>
      )}

      {phase === "declined" && (
        <div className="text-center space-y-3">
          <p className="text-sm text-destructive">Admin declined the call</p>
          <button
            type="button"
            className="text-sm underline text-emerald-600"
            onClick={() => {
              void onRefresh()
              void onCallSupport()
            }}
          >
            Call Again
          </button>
        </div>
      )}

      {phase === "in_call" && (
        <div className="w-full space-y-4">
          <p className="text-center text-2xl font-mono tabular-nums">
            {formatCallDuration(elapsed)}
          </p>
          <p className="text-center text-xs text-muted-foreground">
            {controls?.connected ? "In call" : "Connecting…"}
          </p>
          <div className="flex items-center justify-center gap-4">
            {controls ? (
              <CallMuteButton isMuted={controls.isMuted} onToggle={controls.toggleMute} />
            ) : (
              <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-700" />
            )}
            <button
              type="button"
              onClick={onEndCall}
              className="h-14 px-6 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium flex items-center gap-2"
            >
              <PhoneOff className="h-5 w-5" />
              Hang Up
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Floating agent → admin voice support widget (LiveKit audio). */
export function AgentCallWidget() {
  const pathname = usePathname()
  const agent = getStoredAgent()
  const [starting, setStarting] = useState(false)

  const {
    phase,
    dialogOpen,
    setDialogOpen,
    adminAvailable,
    busyCountdown,
    sessionId,
    token,
    serverUrl,
    liveKitActive,
    formatCallDuration,
    initiateCall,
    endCall,
    hangUp,
    refreshAvailability,
  } = useCallWidget({
    role: "agent",
    userId: agent?.id ?? "",
  })

  if (!agent?.id) return null
  if (isStreamingPagePath(pathname)) return null

  const onCallSupport = async () => {
    setStarting(true)
    try {
      await refreshAvailability()
      if (!adminAvailable) {
        toast.message("Admin is on another call. Please wait…")
        return
      }
      await initiateCall()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not place call")
    } finally {
      setStarting(false)
    }
  }

  const handleDialogChange = (open: boolean) => {
    if (!open && (phase === "in_call" || phase === "calling")) {
      toast.message("Use Hang Up to end the call")
      return
    }
    setDialogOpen(open)
  }

  const dialog = (
    <>
      <button
        type="button"
        onClick={() => {
          void refreshAvailability()
          setDialogOpen(true)
        }}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-xl",
          "bg-gradient-to-br from-green-400 to-emerald-500 text-white",
          "flex items-center justify-center hover:scale-105 transition-transform",
          (phase === "calling" || phase === "in_call") && "animate-pulse",
        )}
        aria-label="Call support"
      >
        <Phone className="h-6 w-6" />
      </button>

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-md rounded-2xl shadow-xl border-border/60 max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-emerald-600" />
              Support call
            </DialogTitle>
          </DialogHeader>
          <AgentCallDialogUI
            phase={phase}
            adminAvailable={adminAvailable}
            busyCountdown={busyCountdown}
            starting={starting}
            onCallSupport={onCallSupport}
            onRefresh={refreshAvailability}
            onEndCall={() => void (hangUp ?? endCall)()}
            formatCallDuration={formatCallDuration}
          />
        </DialogContent>
      </Dialog>
    </>
  )

  if (liveKitActive && token && serverUrl && sessionId) {
    return (
      <CallAudioSession token={token} serverUrl={serverUrl} sessionKey={sessionId}>
        {dialog}
      </CallAudioSession>
    )
  }

  return dialog
}
