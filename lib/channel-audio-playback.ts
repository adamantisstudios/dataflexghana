import { createHmac, timingSafeEqual } from "crypto"
import { getChannelAudioBucketName, getR2PublicUrl } from "@/lib/r2-client"

function playbackSecret(): string {
  return (
    process.env.AUDIO_PLAYBACK_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "dataflex-audio-playback-dev"
  )
}

/** Sign a short-lived token so <audio src> can hit the stream API without Bearer headers. */
export function signAudioPlaybackToken(
  lectureId: string,
  agentId: string,
  ttlSec = 60 * 60 * 4,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSec
  const payload = `${lectureId}:${agentId}:${exp}`
  const sig = createHmac("sha256", playbackSecret()).update(payload).digest("base64url")
  return Buffer.from(`${payload}:${sig}`).toString("base64url")
}

export function verifyAudioPlaybackToken(
  token: string,
  lectureId: string,
): { agentId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8")
    const lastColon = decoded.lastIndexOf(":")
    if (lastColon === -1) return null
    const payload = decoded.slice(0, lastColon)
    const sig = decoded.slice(lastColon + 1)
    const [lid, agentId, expStr] = payload.split(":")
    if (lid !== lectureId || !agentId || !expStr) return null
    if (Number(expStr) < Math.floor(Date.now() / 1000)) return null

    const expected = createHmac("sha256", playbackSecret()).update(payload).digest("base64url")
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null

    return { agentId }
  } catch {
    return null
  }
}

/** Build same-origin stream URL for HTML audio elements. */
export function getAudioStreamPath(lectureId: string, agentId: string): string {
  const token = signAudioPlaybackToken(lectureId, agentId)
  return `/api/channel/audio/${lectureId}/stream?token=${encodeURIComponent(token)}`
}

/** Extract R2 object key from a stored public URL (handles legacy bucket-in-path URLs). */
export function extractR2ObjectKeyFromUrl(audioUrl: string): string | null {
  if (!audioUrl?.trim()) return null
  try {
    const u = new URL(audioUrl.trim())
    let path = decodeURIComponent(u.pathname.replace(/^\//, ""))
    if (!path) return null

    const bucket = getChannelAudioBucketName()
    if (path.startsWith(`${bucket}/`)) {
      path = path.slice(bucket.length + 1)
    }
    return path
  } catch {
    return null
  }
}

/** Repair legacy URLs that incorrectly included the bucket name in the path. */
export function repairChannelAudioPublicUrl(audioUrl: string): string {
  if (!audioUrl?.trim()) return ""
  const trimmed = audioUrl.trim()
  if (!trimmed.startsWith("http")) return trimmed

  const key = extractR2ObjectKeyFromUrl(trimmed)
  if (!key) return trimmed

  try {
    return getR2PublicUrl(key, getChannelAudioBucketName())
  } catch {
    return trimmed
  }
}
