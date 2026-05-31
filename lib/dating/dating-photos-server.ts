import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getAdminClient } from "@/lib/supabase-base"
import {
  deleteFromR2,
  getR2Client,
  getR2Endpoint,
  getR2ObjectStream,
  requireEnv,
} from "@/lib/r2-client"
import { getR2RequestLogMeta, logS3PutObjectError } from "@/lib/r2-s3-error"

export const DATING_PHOTOS_BUCKET =
  process.env.R2_DATING_PHOTOS_BUCKET_NAME || "dataflex-dating-photos"

export const MAX_PHOTOS_PER_PROFILE = 5

export type DatingProfilePhoto = {
  id: string
  profile_id: string
  storage_path: string
  public_url: string
  order_index: number
  created_at: string
}

export type DatingR2Config = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  endpoint: string
}

export function getDatingPhotosBucket(): string {
  return process.env.R2_DATING_PHOTOS_BUCKET_NAME?.trim() || "dataflex-dating-photos"
}

/** Resolve and validate shared R2 env (same credentials as channel audio / attachments). */
export function getDatingR2Config(): DatingR2Config {
  const accountId = requireEnv("R2_ACCOUNT_ID")
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID")
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY")
  const bucketName = getDatingPhotosBucket()

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint: getR2Endpoint(accountId),
  }
}

function encodeObjectKey(objectKey: string): string {
  return objectKey
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
}

/** Public r2.dev base when bucket public access is enabled (see Cloudflare R2 settings). */
export function getDatingPhotosPublicUrlBase(): string | null {
  const explicit = process.env.R2_DATING_PHOTOS_PUBLIC_URL_BASE?.trim().replace(/\/$/, "")
  if (explicit) return explicit
  try {
    const accountId = requireEnv("R2_ACCOUNT_ID")
    return `https://${getDatingPhotosBucket()}.${accountId}.r2.dev`
  } catch {
    return null
  }
}

/** Agent-authenticated image proxy (works without public bucket). */
export function getDatingPhotoServePath(photoId: string): string {
  return `/api/agent/dating/photos/${photoId}/serve`
}

/** Admin-authenticated image proxy. */
export function getDatingPhotoAdminServePath(photoId: string): string {
  return `/api/admin/dating/photos/${photoId}/serve`
}

/**
 * URL stored on the row and sent to clients.
 * Default: serve route (private bucket). Set R2_DATING_PHOTOS_USE_PUBLIC_URL=true after enabling public access.
 */
export function getDatingPhotoPublicUrl(objectKey: string, photoId?: string): string {
  const publicBase = getDatingPhotosPublicUrlBase()
  if (publicBase && process.env.R2_DATING_PHOTOS_USE_PUBLIC_URL === "true") {
    return `${publicBase}/${encodeObjectKey(objectKey)}`
  }
  if (photoId) {
    return getDatingPhotoServePath(photoId)
  }
  if (publicBase && process.env.R2_DATING_PHOTOS_USE_PUBLIC_URL === "true") {
    return `${publicBase}/${encodeObjectKey(objectKey)}`
  }
  return `/api/agent/dating/photos/serve?key=${encodeURIComponent(objectKey)}`
}

/** Fix stale DB public_url values (e.g. wrong pub-{account}.r2.dev paths). */
export function normalizeDatingPhotoRow(photo: DatingProfilePhoto): DatingProfilePhoto {
  return {
    ...photo,
    public_url: getDatingPhotoPublicUrl(photo.storage_path, photo.id),
  }
}

function normalizeDatingPhotoRows(photos: DatingProfilePhoto[]): DatingProfilePhoto[] {
  return photos.map(normalizeDatingPhotoRow)
}

export async function uploadDatingPhotoBufferToR2(
  buffer: Buffer,
  objectKey: string,
  contentType: string,
  photoId?: string,
): Promise<string> {
  const bucketName = getDatingPhotosBucket()
  const key = objectKey.replace(/^\/+/, "")

  if (!buffer?.length) {
    throw new Error("Empty image buffer — file may not have been read correctly")
  }

  const normalizedContentType = (contentType || "image/jpeg").trim() || "image/jpeg"
  const logMeta = getR2RequestLogMeta(bucketName, key, normalizedContentType)

  console.log("[dating-photos] R2 PutObject starting:", { ...logMeta, bytes: buffer.length })

  try {
    const client = getR2Client()
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: normalizedContentType,
      }),
    )
    console.log("[dating-photos] R2 PutObject success:", { bucket: bucketName, key })
    return getDatingPhotoPublicUrl(key, photoId)
  } catch (err) {
    await logS3PutObjectError("dating-photos", err, { ...logMeta, bytes: buffer.length })
    const message = err instanceof Error ? err.message : String(err)
    const name = err instanceof Error ? err.name : "UnknownError"
    throw new Error(`R2 upload failed (${name}): ${message}`)
  }
}

export function buildDatingPhotoKey(agentId: string, photoId: string, ext: string): string {
  const safeExt = ext.replace(/^\./, "").toLowerCase() || "jpg"
  return `agents/${agentId}/${photoId}.${safeExt}`
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

export async function uploadProfilePhoto(
  profileId: string,
  agentId: string,
  buffer: Buffer,
  contentType: string,
  ext: string,
): Promise<DatingProfilePhoto> {
  const db = getAdminClient()
  const current = await countProfilePhotos(profileId)
  if (current >= MAX_PHOTOS_PER_PROFILE) {
    throw new Error(`Maximum ${MAX_PHOTOS_PER_PROFILE} photos allowed`)
  }

  const photoId = crypto.randomUUID()
  const storage_path = buildDatingPhotoKey(agentId, photoId, ext)

  let public_url: string
  try {
    public_url = await uploadDatingPhotoBufferToR2(
      buffer,
      storage_path,
      contentType,
      photoId,
    )
  } catch (err) {
    console.error("[dating-photos] uploadProfilePhoto R2 step failed:", err)
    throw err
  }

  const { data, error } = await db
    .from("dating_profile_photos")
    .insert({
      id: photoId,
      profile_id: profileId,
      storage_path,
      public_url,
      order_index: current,
    })
    .select("*")
    .single()

  if (error) {
    console.error("[dating-photos] DB insert failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    await deleteFromR2(storage_path, getDatingPhotosBucket()).catch((e) => {
      console.error("[dating-photos] R2 rollback delete failed:", e)
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

  await deleteFromR2(photo.storage_path, getDatingPhotosBucket()).catch((e) => {
    console.error("[dating-photos] R2 delete:", e)
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

export async function streamDatingPhoto(photo: DatingProfilePhoto) {
  return getR2ObjectStream(photo.storage_path, { bucketName: getDatingPhotosBucket() })
}
