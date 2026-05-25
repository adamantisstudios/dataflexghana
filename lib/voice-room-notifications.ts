import { getAdminClient } from "@/lib/supabase-base"
import { normalizeVoiceRegion } from "@/lib/voice-room-regions"

/** Notify agents in a region about a new voice conference (best-effort). */
export async function notifyAgentsVoiceRoomCreated(region: string, roomName: string): Promise<number> {
  const db = getAdminClient()
  const target = normalizeVoiceRegion(region)

  const { data: agents, error } = await db
    .from("agents")
    .select("id, region, full_name")
    .eq("isapproved", true)
    .eq("isbanned", false)

  if (error || !agents?.length) return 0

  const matched = agents.filter((a) => normalizeVoiceRegion(a.region) === target)
  if (matched.length === 0) return 0

  const title = `Voice conference — ${region}`
  const message = `A live voice meeting is open for your region. Join from Voice Conference Room in your dashboard. Room: ${roomName}`
  const now = new Date()
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  let sent = 0
  for (const agent of matched) {
    const row = {
      title,
      message,
      start_date: now.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      frequency: "once",
      template_name: "voice_room_invite",
      is_active: true,
      target_agent_id: agent.id,
    }
    const { error: insertErr } = await db.from("agent_notifications").insert(row)
    if (!insertErr) sent += 1
  }

  return sent
}
