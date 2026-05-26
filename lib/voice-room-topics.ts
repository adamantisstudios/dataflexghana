export const VOICE_TOPIC_HAND_RAISE = "hand-raise"
export const VOICE_TOPIC_ADMIN_SHARE = "admin-share"
export const VOICE_TOPIC_GRANT_SPEAK = "grant-speak"
/** Server → agent: reconnect with publish token and enable microphone */
export const VOICE_TOPIC_UNMUTE_COMMAND = "unmute-command"
/** Admin → agent: allow or revoke camera publish (metadata + optional reconnect) */
export const VOICE_TOPIC_VIDEO_PERMISSION = "video-permission"
export const VOICE_TOPIC_REACTION = "reaction"
export const VOICE_TOPIC_CHAT = "chat"
export const VOICE_TOPIC_POLL = "poll"
export const VOICE_TOPIC_DEMOTE = "demote"
export const VOICE_TOPIC_SPOTLIGHT = "spotlight"

export const VOICE_REACTION_EMOJIS = ["👏", "🔥", "💡", "❤️"] as const
export type VoiceReactionEmoji = (typeof VOICE_REACTION_EMOJIS)[number]

export const VOICE_ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]
