import type { Participant } from "livekit-client"
import type { VoiceParticipantRole } from "@/lib/livekit-server"

export function getParticipantRole(participant: Participant): VoiceParticipantRole | string {
  try {
    const meta = participant.metadata ? JSON.parse(participant.metadata) : {}
    return meta.role || participant.attributes?.role || "listener"
  } catch {
    return participant.attributes?.role || "listener"
  }
}

export function isSpeakerRole(role: string): boolean {
  return role === "speaker" || role === "moderator" || role === "admin"
}

export function roleLabel(role: string): string {
  if (role === "moderator") return "Moderator"
  if (role === "speaker") return "Speaker"
  if (role === "admin") return "Host"
  return "Listener"
}
