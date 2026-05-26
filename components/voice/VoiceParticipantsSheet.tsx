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
import { Users, Mic, MicOff, Video, VideoOff } from "lucide-react"
import {
  getParticipantRole,
  isSpeakerRole,
  roleLabel,
} from "@/components/voice/voice-participant-utils"
import { voiceInitials, voiceAvatarRingColor } from "@/lib/voice-ui-utils"

function parseVideoAllowed(metadata: string | undefined, attributes?: Record<string, string>): boolean {
  try {
    const meta = metadata ? JSON.parse(metadata) : {}
    if (meta.videoAllowed === true) return true
    if (meta.videoAllowed === "true") return true
  } catch {
    /* ignore */
  }
  return attributes?.videoAllowed === "true"
}

type Props = {
  triggerClassName?: string
  compact?: boolean
  side?: "bottom" | "right"
  /** Admin host: show camera permission toggle per speaker */
  isAdminHost?: boolean
  roomId?: string
  onToggleVideo?: (identity: string, allowed: boolean) => void
  videoBusy?: string | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

export function VoiceParticipantsSheet({
  triggerClassName,
  compact,
  side = "bottom",
  isAdminHost = false,
  onToggleVideo,
  videoBusy,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: Props) {
  const participants = useParticipants()

  const sheet = (
    <SheetContent
      side={side}
      className={
        side === "right"
          ? "flex flex-col max-w-sm w-full sm:max-w-md h-full bg-[#292a2d] border-[#3c4043] text-[#e8eaed] p-0"
          : "flex flex-col rounded-t-2xl max-h-[min(85dvh,600px)] bg-[#292a2d] border-[#3c4043] text-[#e8eaed] p-0"
      }
    >
      <SheetHeader className="shrink-0 px-4 pt-4 pb-2 border-b border-[#3c4043]">
        <SheetTitle className="text-[#e8eaed] text-sm">
          Participants ({participants.length})
        </SheetTitle>
      </SheetHeader>
      <ul className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2">
        {participants.map((p) => {
          const role = getParticipantRole(p)
          const ring = voiceAvatarRingColor(p.identity)
          const micPub = p.getTrackPublication(Track.Source.Microphone)
          const camPub = p.getTrackPublication(Track.Source.Camera)
          const muted = micPub?.isMuted ?? !p.isMicrophoneEnabled
          const videoOn = !!camPub?.track && !camPub.isMuted
          const videoAllowed = parseVideoAllowed(p.metadata, p.attributes)
          const showVideoToggle = isAdminHost && !p.isLocal && isSpeakerRole(role) && onToggleVideo

          return (
            <li
              key={p.identity}
              className="flex items-center gap-2 rounded-lg border border-[#3c4043] bg-[#3c4043]/40 px-2 py-2"
            >
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{
                  boxShadow: `0 0 0 2px ${ring}`,
                  background: `linear-gradient(135deg, ${ring}99, ${ring})`,
                }}
              >
                {voiceInitials(p.name || p.identity)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate text-[#e8eaed]">
                  {p.name || p.identity}
                  {p.isLocal ? " (you)" : ""}
                </p>
                <p className="text-[10px] text-[#9aa0a6]">
                  {roleLabel(role)}
                  {videoOn ? " · Video on" : videoAllowed ? " · Video allowed" : ""}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {showVideoToggle && (
                  <button
                    type="button"
                    disabled={videoBusy === p.identity}
                    onClick={() => onToggleVideo(p.identity, !videoAllowed)}
                    className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center bg-[#202124] hover:bg-[#4a4d51] text-[#e8eaed]"
                    title={videoAllowed ? "Revoke video" : "Allow video"}
                  >
                    {videoAllowed ? (
                      <Video className="h-4 w-4 text-[#0E8F3D]" />
                    ) : (
                      <VideoOff className="h-4 w-4 text-[#9aa0a6]" />
                    )}
                  </button>
                )}
                {muted ? (
                  <MicOff className="h-4 w-4 text-[#9aa0a6]" />
                ) : (
                  <Mic className="h-4 w-4 text-[#0E8F3D]" />
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </SheetContent>
  )

  if (controlledOpen !== undefined && onOpenChange) {
    return (
      <Sheet open={controlledOpen} onOpenChange={onOpenChange}>
        {!hideTrigger && (
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={
                triggerClassName ??
                "h-11 w-11 min-h-[44px] min-w-[44px] p-0 rounded-full bg-[#3c4043] text-[#e8eaed]"
              }
              aria-label="View participants"
            >
              <Users className="h-5 w-5" />
            </Button>
          </SheetTrigger>
        )}
        {sheet}
      </Sheet>
    )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={
            triggerClassName ??
            (compact
              ? "h-11 w-11 min-h-[44px] min-w-[44px] p-0 rounded-full bg-[#3c4043] text-[#e8eaed]"
              : "h-12 px-3 rounded-xl border-white/20 bg-slate-800/80 text-white text-sm")
          }
          aria-label="View participants"
        >
          <Users className={compact ? "h-5 w-5" : "h-5 w-5"} />
        </Button>
      </SheetTrigger>
      {sheet}
    </Sheet>
  )
}
