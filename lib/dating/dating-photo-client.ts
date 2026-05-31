/** Client-side dating photo URL resolution (no server imports). */

export type DatingPhotoRef = {
  id: string
  public_url?: string | null
}

/** Always use authenticated serve proxy (private R2 bucket). */
export function getDatingPhotoServePath(photoId: string): string {
  return `/api/agent/dating/photos/${photoId}/serve`
}

export function resolveDatingPhotoUrl(photo: DatingPhotoRef): string {
  return getDatingPhotoServePath(photo.id)
}

export function resolveDiscoverCardPhotoUrl(profile: {
  first_photo_id?: string | null
  photos?: DatingPhotoRef[]
}): string | null {
  const photo = profile.photos?.[0]
  const id = profile.first_photo_id ?? photo?.id
  if (!id) return null
  return getDatingPhotoServePath(id)
}
