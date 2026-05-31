import { getAdminClient } from "@/lib/supabase-base"
import { deleteObjectFromR2Worker } from "@/lib/dating/dating-r2-worker"
import { getPhotosForProfile } from "@/lib/dating/dating-photos"

export type DeleteDatingAccountResult = {
  profileId: string
  agentId: string
  photosRemoved: number
}

/**
 * Permanently delete an agent's dating account: R2 objects, photos, profile, and related rows.
 */
export async function deleteDatingAccountByAgentId(agentId: string): Promise<DeleteDatingAccountResult> {
  const db = getAdminClient()

  const { data: profile, error: profileErr } = await db
    .from("dating_profiles")
    .select("id, agent_id")
    .eq("agent_id", agentId)
    .maybeSingle()

  if (profileErr) {
    throw new Error(profileErr.message)
  }
  if (!profile) {
    const err = new Error("Dating profile not found")
    ;(err as Error & { statusCode?: number }).statusCode = 404
    throw err
  }

  const profileId = profile.id as string
  const photos = await getPhotosForProfile(profileId)

  for (const photo of photos) {
    if (photo.storage_path?.trim()) {
      await deleteObjectFromR2Worker(photo.storage_path).catch((e) => {
        console.error("[dating/delete] Worker delete failed:", photo.storage_path, e)
      })
    }
  }

  if (photos.length > 0) {
    const { error: photosErr } = await db
      .from("dating_profile_photos")
      .delete()
      .eq("profile_id", profileId)
    if (photosErr) {
      throw new Error(`Failed to delete photo records: ${photosErr.message}`)
    }
  }

  const { data: matchRows } = await db
    .from("dating_matches")
    .select("id")
    .or(`agent_a_id.eq.${agentId},agent_b_id.eq.${agentId}`)

  const matchIds = (matchRows ?? []).map((m) => m.id as string)
  if (matchIds.length > 0) {
    await db.from("dating_messages").delete().in("match_id", matchIds)
    await db.from("dating_matches").delete().in("id", matchIds)
  }

  await db.from("dating_swipes").delete().or(`swiper_agent_id.eq.${agentId},swiped_agent_id.eq.${agentId}`)
  await db.from("dating_blocks").delete().or(`blocker_agent_id.eq.${agentId},blocked_agent_id.eq.${agentId}`)
  await db
    .from("dating_reports")
    .delete()
    .or(`reporter_agent_id.eq.${agentId},reported_agent_id.eq.${agentId}`)
  await db.from("dating_counselling_sessions").delete().eq("agent_id", agentId)
  await db.from("dating_preferences").delete().eq("agent_id", agentId)
  await db.from("dating_subscriptions").delete().eq("agent_id", agentId)

  const { error: profileDeleteErr } = await db.from("dating_profiles").delete().eq("id", profileId)
  if (profileDeleteErr) {
    throw new Error(`Failed to delete profile: ${profileDeleteErr.message}`)
  }

  return {
    profileId,
    agentId,
    photosRemoved: photos.length,
  }
}
