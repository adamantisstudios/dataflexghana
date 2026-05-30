import { getAdminClient } from "@/lib/supabase-base"

/** In-app bell notification when an admin rejects a dating profile (best-effort). */
export async function notifyAgentDatingProfileRejected(
  agentId: string,
  reason: string,
): Promise<void> {
  const db = getAdminClient()
  const now = new Date()
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const trimmed = reason.trim().slice(0, 500)

  const { error } = await db.from("agent_notifications").insert({
    title: "Dating profile rejected",
    message: `Your Find a Date profile was not approved: ${trimmed}. Review the reason, update your profile, and submit again.`,
    start_date: now.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
    frequency: "once",
    template_name: "dating_profile_rejected",
    is_active: true,
    target_agent_id: agentId,
  })

  if (error) {
    console.error("[dating-notifications] reject notify failed:", error.message)
  }
}
