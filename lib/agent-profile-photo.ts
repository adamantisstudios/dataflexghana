import { getAdminClient } from "@/lib/supabase-base"

/** Save uploaded photo URL; awaits admin approval (profile_verified stays false). */
export async function submitAgentProfilePhotoForReview(
  agentId: string,
  profileImageUrl: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getAdminClient()
  const url = profileImageUrl.trim()
  if (!url) {
    return { ok: false, error: "Photo URL is required" }
  }

  const { error } = await db
    .from("agents")
    .update({ profile_image_url: url, profile_verified: false })
    .eq("id", agentId)

  if (error) {
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

/** Admin approval — marks photo verified. */
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
