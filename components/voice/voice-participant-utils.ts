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
  return role === "speaker" || role === "moderator" || role === "co-host" || role === "admin"
}

export function isCoHostRole(role: string): boolean {
  return role === "co-host" || role === "moderator" || role === "admin"
}

export function isHostParticipant(identity: string, role: string): boolean {
  return role === "admin" || identity.startsWith("admin-")
}

export function roleLabel(role: string): string {
  if (role === "moderator") return "Moderator"
  if (role === "co-host") return "Co-host"
  if (role === "speaker") return "Speaker"
  if (role === "admin") return "Host"
  return "Listener"
}
