import { type NextRequest, NextResponse } from "next/server"
import { authenticateAdmin } from "@/lib/api-auth"
import { getPhotoById, streamDatingPhoto, type DatingProfilePhoto } from "@/lib/dating/dating-photos-server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 })

  const { photoId } = await params
  const photo = await getPhotoById(photoId)
  if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 })

  return streamPhotoResponse(photo)
}

async function streamPhotoResponse(photo: DatingProfilePhoto) {
  const result = await streamDatingPhoto(photo)
  if (!result.Body) {
    return NextResponse.json({ error: "Image missing in storage" }, { status: 404 })
  }
  const headers = new Headers()
  headers.set("Content-Type", result.ContentType || "image/jpeg")
  headers.set("Cache-Control", "private, max-age=3600")
  if (result.ContentLength != null) {
    headers.set("Content-Length", String(result.ContentLength))
  }
  return new NextResponse(result.Body.transformToWebStream(), { status: 200, headers })
}
