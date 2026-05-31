/** Client-side dating photo URL resolution (no server imports). */

export type DatingPhotoRef = {
  id: string
  public_url?: string | null
}

const DATING_BUCKET = "dataflex-dating-photos"

/** R2 public bucket URL: https://<bucket>.<account_id>.r2.dev/<key> */
const R2_BUCKET_PUBLIC_PATTERN = new RegExp(
  `^https://${DATING_BUCKET}\\.[a-f0-9]+\\.r2\\.dev/`,
  "i",
)

/** Legacy broken URLs saved before dating bucket had its own public domain. */
const LEGACY_PUB_R2_PATTERN = /^https:\/\/pub-[a-f0-9]+\.r2\.dev\//i

function getTrustedPublicBase(): string | null {
  const base = process.env.NEXT_PUBLIC_R2_DATING_PHOTOS_PUBLIC_URL_BASE?.trim().replace(/\/$/, "")
  return base || null
}

/** True when URL is an absolute http(s) URL suitable for direct <img src> (no agent auth). */
export function isAbsolutePhotoUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false
  const trimmed = url.trim()
  if (!/^https?:\/\//i.test(trimmed)) return false
  if (trimmed.includes("/api/agent/dating/photos/")) return false
  if (LEGACY_PUB_R2_PATTERN.test(trimmed)) return false
  const trustedBase = getTrustedPublicBase()
  if (trustedBase && trimmed.startsWith(`${trustedBase}/`)) return true
  if (R2_BUCKET_PUBLIC_PATTERN.test(trimmed)) return true
  return false
}

export function getDatingPhotoServePath(photoId: string): string {
  return `/api/agent/dating/photos/${photoId}/serve`
}

/** Prefer trusted public CDN; otherwise authenticated serve route. */
export function resolveDatingPhotoUrl(photo: DatingPhotoRef): string {
  if (isAbsolutePhotoUrl(photo.public_url)) {
    return photo.public_url!.trim()
  }
  return getDatingPhotoServePath(photo.id)
}

export function isDatingPhotoServeUrl(url: string): boolean {
  return url.includes("/api/agent/dating/photos/") && url.endsWith("/serve")
}

export function resolveDiscoverCardPhotoUrl(profile: {
  first_photo_id?: string | null
  photos?: DatingPhotoRef[]
}): string | null {
  const photo = profile.photos?.[0]
  const id = profile.first_photo_id ?? photo?.id
  if (!id) return null
  return resolveDatingPhotoUrl({
    id,
    public_url: photo?.public_url,
  })
}
