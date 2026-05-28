export type AudioAttachment = {
  name: string
  url: string
  type: string
}

export type AudioLecture = {
  id: string
  channel_id: string
  title: string
  description: string | null
  audio_url: string
  /** Same-origin stream URL with signed token (preferred for <audio>). */
  playback_url?: string
  duration: number | null
  attachments: AudioAttachment[]
  created_at: string
}

export type AudioCommentRow = {
  id: string
  lecture_id: string
  author_id: string
  content: string
  timestamp: number | null
  parent_id: string | null
  created_at: string
}

export type AudioComment = AudioCommentRow & {
  author_name: string
  replies: AudioComment[]
}

export function parseAttachments(raw: unknown): AudioAttachment[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((a) => a && typeof a === "object" && "url" in a)
    .map((a) => ({
      name: String((a as AudioAttachment).name || "Attachment"),
      url: String((a as AudioAttachment).url),
      type: String((a as AudioAttachment).type || "application/octet-stream"),
    }))
}

export function nestAudioComments(
  rows: AudioCommentRow[],
  nameMap: Map<string, string>,
): AudioComment[] {
  const byId = new Map<string, AudioComment>()
  const roots: AudioComment[] = []

  for (const row of rows) {
    byId.set(row.id, {
      ...row,
      author_name: nameMap.get(String(row.author_id)) || "Member",
      replies: [],
    })
  }

  for (const row of rows) {
    const node = byId.get(row.id)!
    if (row.parent_id && byId.has(row.parent_id)) {
      byId.get(row.parent_id)!.replies.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export function formatTimestamp(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds)) return ""
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, "0")}`
}
