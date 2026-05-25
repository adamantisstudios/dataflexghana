import { VOICE_TOPIC_CHAT, VOICE_TOPIC_DEMOTE, VOICE_TOPIC_POLL, VOICE_TOPIC_SPOTLIGHT } from "@/lib/voice-room-topics"

export type VoicePollPayload = {
  type: "poll"
  pollId: string
  question: string
  options: string[]
  endsAt: number
}

export type VoicePollVotePayload = {
  type: "poll-vote"
  pollId: string
  optionIndex: number
  voterName: string
}

export type VoiceDemotePayload = {
  type: "demote"
  identity: string
}

export type VoiceSpotlightPayload = {
  type: "spotlight"
  identity: string | null
  active: boolean
}

export type VoiceDataMessage =
  | VoicePollPayload
  | VoicePollVotePayload
  | VoiceDemotePayload
  | VoiceSpotlightPayload
  | { type: "chat-delete"; id: string }
  | { type: "chat-clear" }

export function encodeVoiceData(msg: VoiceDataMessage): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(msg))
}

export function decodeVoiceData(payload: Uint8Array): VoiceDataMessage | null {
  try {
    return JSON.parse(new TextDecoder().decode(payload)) as VoiceDataMessage
  } catch {
    return null
  }
}

export const VOICE_DATA_TOPICS = [
  VOICE_TOPIC_CHAT,
  VOICE_TOPIC_POLL,
  VOICE_TOPIC_DEMOTE,
  VOICE_TOPIC_SPOTLIGHT,
] as const
