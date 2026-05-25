"use client"

import { Track } from "livekit-client"
import { useParticipants } from "@livekit/components-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Users, Mic, MicOff } from "lucide-react"
import { getParticipantRole, roleLabel } from "@/components/voice/voice-participant-utils"
import { voiceInitials, voiceAvatarRingColor } from "@/lib/voice-ui-utils"

type Props = {
  triggerClassName?: string
  compact?: boolean
  side?: "bottom" | "right"
}

export function VoiceParticipantsSheet({ triggerClassName, compact, side = "bottom" }: Props) {
  const participants = useParticipants()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={
            triggerClassName ??
            (compact
              ? "h-9 w-9 p-0 rounded-lg border-white/20 bg-slate-800/80 text-white"
              : "h-12 px-3 rounded-xl border-white/20 bg-slate-800/80 text-white text-sm")
          }
          aria-label="View participants"
        >
          <Users className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={side}
        className={
          side === "right"
            ? "max-w-sm w-full sm:max-w-md h-full bg-[#292a2d] border-[#3c4043] text-[#e8eaed]"
            : "rounded-t-2xl max-h-[55dvh] bg-[#292a2d] border-[#3c4043] text-[#e8eaed]"
        }
      >
        <SheetHeader>
          <SheetTitle className="text-[#e8eaed] text-sm">
            Participants ({participants.length})
          </SheetTitle>
        </SheetHeader>
        <ul className="mt-3 space-y-2 overflow-y-auto max-h-[42dvh] pb-4">
          {participants.map((p) => {
            const role = getParticipantRole(p)
            const ring = voiceAvatarRingColor(p.identity)
            const micPub = p.getTrackPublication(Track.Source.Microphone)
            const muted = micPub?.isMuted ?? !p.isMicrophoneEnabled
            return (
              <li
                key={p.identity}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800/50 px-2 py-2"
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{
                    boxShadow: `0 0 0 2px ${ring}`,
                    background: `linear-gradient(135deg, ${ring}99, ${ring})`,
                  }}
                >
                  {voiceInitials(p.name || p.identity)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate text-white">
                    {p.name || p.identity}
                    {p.isLocal ? " (you)" : ""}
                  </p>
                  <p className="text-[10px] text-slate-400">{roleLabel(role)}</p>
                </div>
                {muted ? (
                  <MicOff className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                ) : (
                  <Mic className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                )}
              </li>
            )
          })}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
