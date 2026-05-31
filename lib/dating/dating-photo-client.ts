/** Client-side dating photo URL resolution (no server imports). */

export type DatingPhotoRef = {
  id: string
  public_url?: string | null
}

/** True when URL is an absolute http(s) URL suitable for <img src>. */
export function isAbsolutePhotoUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false
  const trimmed = url.trim()
  if (!/^https?:\/\//i.test(trimmed)) return false
  if (trimmed.includes("/api/agent/dating/photos/")) return false
  return true
}

/** Prefer public CDN URL; otherwise authenticated serve route (requires agent session cookie). */
export function resolveDatingPhotoUrl(photo: DatingPhotoRef): string {
  if (isAbsolutePhotoUrl(photo.public_url)) {
    return photo.public_url!.trim()
  }
  return `/api/agent/dating/photos/${photo.id}/serve`
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
