import { getAdminClient } from "@/lib/supabase-base"

/** Mark agent profile photo as verified (after client face-api checks). */
export async function markAgentProfilePhotoVerified(
  agentId: string,
  profileImageUrl?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getAdminClient()
  const updates: Record<string, unknown> = { profile_verified: true }
  if (profileImageUrl?.trim()) {
    updates.profile_image_url = profileImageUrl.trim()
  }

  const { error } = await db.from("agents").update(updates).eq("id", agentId)

  if (error) {
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
