"use client"

import { Track, type Participant } from "livekit-client"
import { VoiceVideoFrame } from "@/components/voice/VoiceVideoFrame"
import { getParticipantRole, isHostParticipant } from "@/components/voice/voice-participant-utils"
import type { VoiceVideoBadge } from "@/components/voice/VoiceVideoFrame"

type Props = {
  participants: Participant[]
  localIdentity: string
}

function badgeFor(participant: Participant, localIdentity: string): VoiceVideoBadge {
  if (participant.identity === localIdentity) return "agent"
  const role = getParticipantRole(participant)
  if (isHostParticipant(participant.identity, role)) return "host"
  return "speaker"
}

/** Smaller tiles for secondary video participants (Meet-style). */
export function VoiceStageFilmstrip({ participants, localIdentity }: Props) {
  if (participants.length === 0) return null

  return (
    <div className="w-full shrink-0 pb-2">
      <p className="text-[10px] uppercase tracking-wider text-white/60 text-center mb-2">
        In call
      </p>
      <div className="flex gap-2 overflow-x-auto justify-center px-2 pb-1">
        {participants.map((p) => {
          const pub = p.getTrackPublication(Track.Source.Camera)
          if (!pub?.track || pub.isMuted) return null
          return (
            <div
              key={p.identity}
              className="shrink-0 w-[88px] sm:w-[100px] rounded-lg overflow-hidden border border-white/20 bg-black"
            >
              <VoiceVideoFrame
                participant={p}
                publication={pub}
                variant="chip"
                badge={badgeFor(p, localIdentity)}
                mirror={p.identity === localIdentity}
                className="w-full"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
