import { notifyAdminPhotoVerification } from "@/lib/admin-photo-verification-notify"
import { getAdminClient } from "@/lib/supabase-base"

/** Save uploaded photo URL; either auto-approves or awaits admin approval. */
export async function submitAgentProfilePhotoForReview(
  agentId: string,
  profileImageUrl: string,
  autoApprove = false,
  meta?: { ipAddress?: string | null; userAgent?: string | null },
): Promise<{ ok: true; profileVerified: boolean } | { ok: false; error: string }> {
  const db = getAdminClient()
  const url = profileImageUrl.trim()
  if (!url) {
    return { ok: false, error: "Photo URL is required" }
  }

  const { data: agentRow } = await db
    .from("agents")
    .select("id, full_name, profile_verified, profile_image_url")
    .eq("id", agentId)
    .maybeSingle()

  const { error } = await db
    .from("agents")
    .update({ profile_image_url: url, profile_verified: autoApprove })
    .eq("id", agentId)

  if (error) {
    return { ok: false, error: error.message }
  }

  const agentName = agentRow?.full_name ?? null
  const wasAlreadyVerified = agentRow?.profile_verified === true

  // Only alert when a NEW auto-verification lands in the Verified list
  // (face-check passed). Admins can open Photo Verification → Verified and revoke if needed.
  if (autoApprove && !wasAlreadyVerified) {
    try {
      await notifyAdminPhotoVerification({
        agentId,
        agentName,
        profileImageUrl: url,
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
      })
    } catch (e) {
      console.error("[agent-profile-photo] notify admin failed:", e)
    }
  }

  return { ok: true, profileVerified: autoApprove }
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
