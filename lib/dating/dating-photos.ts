import { getAdminClient } from "@/lib/supabase-base"
import { deleteObjectFromR2Worker } from "@/lib/dating/dating-r2-worker"

export const MAX_PHOTOS_PER_PROFILE = 5

export type DatingProfilePhoto = {
  id: string
  profile_id: string
  storage_path: string
  public_url: string
  order_index: number
  created_at: string
}

/** Authenticated proxy path only (private bucket; no public r2.dev URLs). */
export function getDatingPhotoServePath(photoId: string): string {
  return `/api/agent/dating/photos/${photoId}/serve`
}

export function getDatingPhotoAdminServePath(photoId: string): string {
  return `/api/admin/dating/photos/${photoId}/serve`
}

export function normalizeDatingPhotoRow(photo: DatingProfilePhoto): DatingProfilePhoto {
  return {
    ...photo,
    public_url: getDatingPhotoServePath(photo.id),
  }
}

function normalizeDatingPhotoRows(photos: DatingProfilePhoto[]): DatingProfilePhoto[] {
  return photos.map(normalizeDatingPhotoRow)
}

export async function countProfilePhotos(profileId: string): Promise<number> {
  const { count, error } = await getAdminClient()
    .from("dating_profile_photos")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)

  if (error) {
    console.error("[dating-photos] count error:", error.message, error.code, error.details)
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      throw new Error(
        "dating_profile_photos table not found — run scripts/086_dating_profile_enhancements.sql",
      )
    }
    throw new Error(`Could not count photos: ${error.message}`)
  }
  return count ?? 0
}

export async function getPhotosForProfile(profileId: string): Promise<DatingProfilePhoto[]> {
  const { data, error } = await getAdminClient()
    .from("dating_profile_photos")
    .select("*")
    .eq("profile_id", profileId)
    .order("order_index", { ascending: true })
  if (error) {
    console.error("[dating-photos] list error:", error.message)
    return []
  }
  return normalizeDatingPhotoRows((data ?? []) as DatingProfilePhoto[])
}

export async function getPhotosForProfiles(
  profileIds: string[],
): Promise<Map<string, DatingProfilePhoto[]>> {
  const map = new Map<string, DatingProfilePhoto[]>()
  if (profileIds.length === 0) return map

  const { data, error } = await getAdminClient()
    .from("dating_profile_photos")
    .select("*")
    .in("profile_id", profileIds)
    .order("order_index", { ascending: true })

  if (error) return map

  for (const row of (data ?? []) as DatingProfilePhoto[]) {
    const list = map.get(row.profile_id) ?? []
    list.push(normalizeDatingPhotoRow(row))
    map.set(row.profile_id, list)
  }
  return map
}

export async function getPhotoById(photoId: string): Promise<DatingProfilePhoto | null> {
  const { data, error } = await getAdminClient()
    .from("dating_profile_photos")
    .select("*")
    .eq("id", photoId)
    .maybeSingle()
  if (error || !data) return null
  return normalizeDatingPhotoRow(data as DatingProfilePhoto)
}

/** Insert DB row after Worker upload (storage_path = Worker key). */
export async function insertProfilePhotoRecord(
  profileId: string,
  storageKey: string,
): Promise<DatingProfilePhoto> {
  const db = getAdminClient()
  const current = await countProfilePhotos(profileId)
  if (current >= MAX_PHOTOS_PER_PROFILE) {
    throw new Error(`Maximum ${MAX_PHOTOS_PER_PROFILE} photos allowed`)
  }

  const photoId = crypto.randomUUID()
  const public_url = getDatingPhotoServePath(photoId)

  const { data, error } = await db
    .from("dating_profile_photos")
    .insert({
      id: photoId,
      profile_id: profileId,
      storage_path: storageKey,
      public_url,
      order_index: current,
    })
    .select("*")
    .single()

  if (error) {
    await deleteObjectFromR2Worker(storageKey).catch((e) => {
      console.error("[dating-photos] Worker rollback delete failed:", e)
    })
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      throw new Error(
        "dating_profile_photos table not found — run scripts/086_dating_profile_enhancements.sql",
      )
    }
    throw new Error(`Database error: ${error.message}`)
  }

  return normalizeDatingPhotoRow(data as DatingProfilePhoto)
}

export async function deleteProfilePhoto(photoId: string, agentId: string): Promise<void> {
  const db = getAdminClient()
  const photo = await getPhotoById(photoId)
  if (!photo) throw new Error("Photo not found")

  const { data: profile } = await db
    .from("dating_profiles")
    .select("agent_id")
    .eq("id", photo.profile_id)
    .maybeSingle()

  if (!profile || profile.agent_id !== agentId) {
    throw new Error("Not authorized to delete this photo")
  }

  await deleteObjectFromR2Worker(photo.storage_path).catch((e) => {
    console.error("[dating-photos] Worker delete:", e)
  })

  const { error } = await db.from("dating_profile_photos").delete().eq("id", photoId)
  if (error) throw new Error(error.message)

  const remaining = await getPhotosForProfile(photo.profile_id)
  for (let i = 0; i < remaining.length; i++) {
    await db.from("dating_profile_photos").update({ order_index: i }).eq("id", remaining[i].id)
  }
}

export async function reorderProfilePhotos(
  profileId: string,
  agentId: string,
  orderedPhotoIds: string[],
): Promise<DatingProfilePhoto[]> {
  const db = getAdminClient()
  const { data: profile } = await db
    .from("dating_profiles")
    .select("agent_id")
    .eq("id", profileId)
    .maybeSingle()

  if (!profile || profile.agent_id !== agentId) {
    throw new Error("Not authorized")
  }

  const existing = await getPhotosForProfile(profileId)
  const idSet = new Set(existing.map((p) => p.id))
  if (orderedPhotoIds.length !== existing.length || !orderedPhotoIds.every((id) => idSet.has(id))) {
    throw new Error("Invalid photo order")
  }

  for (let i = 0; i < orderedPhotoIds.length; i++) {
    await db.from("dating_profile_photos").update({ order_index: i }).eq("id", orderedPhotoIds[i])
  }

  return getPhotosForProfile(profileId)
}

export async function canViewDatingPhotoById(
  viewerAgentId: string,
  photo: DatingProfilePhoto,
  options?: { isAdmin?: boolean },
): Promise<boolean> {
  if (options?.isAdmin) return true

  const db = getAdminClient()
  const { data: profile } = await db
    .from("dating_profiles")
    .select("agent_id, is_approved")
    .eq("id", photo.profile_id)
    .maybeSingle()

  if (!profile) return false
  if (profile.agent_id === viewerAgentId) return true

  const { getDatingProfile, getBlockedAgentIds, getOrCreateSubscription } = await import(
    "@/lib/dating/dating-server"
  )
  const viewerProfile = await getDatingProfile(viewerAgentId)
  if (!viewerProfile?.is_approved && !options?.isAdmin) return false

  const blocked = await getBlockedAgentIds(viewerAgentId)
  if (blocked.has(profile.agent_id)) return false

  const [a, b] =
    viewerAgentId < profile.agent_id
      ? [viewerAgentId, profile.agent_id]
      : [profile.agent_id, viewerAgentId]

  const { data: match } = await db
    .from("dating_matches")
    .select("id")
    .eq("agent_a_id", a)
    .eq("agent_b_id", b)
    .eq("is_active", true)
    .maybeSingle()

  if (match) return true

  const sub = await getOrCreateSubscription(viewerAgentId)
  return sub.plan === "gold" || sub.plan === "silver"
}
