"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Loader2,
  Phone,
  PhoneIncoming,
  PhoneOff,
  User,
} from "lucide-react"
import { getStoredAdmin } from "@/lib/unified-auth-system"
import { useCallWidget } from "@/hooks/use-call-widget"
import { CallAudioSession, useCallAudioControls } from "@/components/calls/CallAudioSession"
import { CallMuteButton } from "@/components/calls/CallLiveKitAudio"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

function AdminCallDialogUI({
  phase,
  hasIncoming,
  callerName,
  responding,
  onAccept,
  onDecline,
  onEndCall,
  formatCallDuration,
}: {
  phase: string
  hasIncoming: boolean
  callerName: string
  responding: boolean
  onAccept: () => void
  onDecline: () => void
  onEndCall: () => void
  formatCallDuration: (s: number) => string
}) {
  const controls = useCallAudioControls()

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      {phase === "idle" && hasIncoming && (
        <>
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center animate-pulse">
            <User className="h-8 w-8 text-emerald-700" />
          </div>
          <p className="text-lg font-medium">{callerName}</p>
          <p className="text-sm text-muted-foreground">Incoming voice call</p>
          <div className="flex gap-3 w-full">
            <button
              type="button"
              disabled={responding}
              onClick={onAccept}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-medium flex items-center justify-center gap-2"
            >
              {responding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Phone className="h-4 w-4" />
              )}
              Accept
            </button>
            <button
              type="button"
              disabled={responding}
              onClick={onDecline}
              className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium flex items-center justify-center gap-2"
            >
              <PhoneOff className="h-4 w-4" />
              Decline
            </button>
          </div>
        </>
      )}

      {phase === "idle" && !hasIncoming && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No incoming calls. Agents can reach you from their dashboard.
        </p>
      )}

      {phase === "in_call" && controls && (
        <div className="w-full space-y-4">
          <p className="text-center text-lg font-medium">{callerName}</p>
          <p className="text-center text-2xl font-mono tabular-nums">
            {formatCallDuration(controls.elapsed)}
          </p>
          <p className="text-center text-xs text-muted-foreground">
            {controls.connected ? "In call" : "Connecting…"}
          </p>
          <div className="flex items-center justify-center gap-4">
            <CallMuteButton isMuted={controls.isMuted} onToggle={controls.toggleMute} />
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

/** Floating admin widget for incoming agent voice support calls. */
export function AdminCallWidget() {
  const pathname = usePathname()
  const admin = getStoredAdmin()
  const [responding, setResponding] = useState(false)

  const {
    phase,
    dialogOpen,
    setDialogOpen,
    hasIncoming,
    callerName,
    sessionId,
    token,
    serverUrl,
    liveKitActive,
    formatCallDuration,
    acceptCall,
    declineCall,
    endCall,
  } = useCallWidget({
    role: "admin",
    userId: admin?.id ?? "",
  })

  if (!admin?.id) return null
  if (pathname?.includes("/voice-rooms")) return null

  const showWiggle = hasIncoming && phase === "idle"

  useEffect(() => {
    if (hasIncoming && phase === "idle" && !dialogOpen) {
      setDialogOpen(true)
      toast.info(`Incoming call from ${callerName}`, { duration: 5000 })
    }
  }, [hasIncoming, phase, dialogOpen, callerName, setDialogOpen])

  const handleDialogChange = (open: boolean) => {
    if (!open && phase === "in_call") {
      toast.message("Use Hang Up to end the call")
      return
    }
    setDialogOpen(open)
  }

  const dialog = (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-xl",
          "bg-gradient-to-br from-green-400 to-emerald-500 text-white",
          "flex items-center justify-center hover:scale-105 transition-transform",
          showWiggle && "animate-call-wiggle",
          hasIncoming && "animate-pulse",
        )}
        aria-label="Support calls"
      >
        {hasIncoming ? (
          <PhoneIncoming className="h-6 w-6" />
        ) : (
          <Phone className="h-6 w-6" />
        )}
        {hasIncoming && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">
            1
          </span>
        )}
      </button>

      {hasIncoming && !dialogOpen && (
        <div className="fixed bottom-24 right-6 z-50 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-medium shadow-lg animate-fade-in">
          Incoming call
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-md rounded-2xl shadow-xl border-border/60 max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneIncoming className="h-5 w-5 text-emerald-600" />
              Agent support call
            </DialogTitle>
          </DialogHeader>
          <AdminCallDialogUI
            phase={phase}
            hasIncoming={hasIncoming}
            callerName={callerName}
            responding={responding}
            onAccept={() => {
              setResponding(true)
              void (async () => {
                try {
                  await acceptCall()
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not accept")
                } finally {
                  setResponding(false)
                }
              })()
            }}
            onDecline={() => void declineCall()}
            onEndCall={() => void endCall()}
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
