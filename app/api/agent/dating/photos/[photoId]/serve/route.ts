import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, authenticateAdmin, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import {
  canViewDatingPhotoById,
  getPhotoById,
  streamDatingPhoto,
  type DatingProfilePhoto,
} from "@/lib/dating/dating-photos-server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  const { photoId } = await params
  const photo = await getPhotoById(photoId)
  if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 })

  const adminAuth = await authenticateAdmin(request)
  if (adminAuth.success) {
    return streamPhotoResponse(photo)
  }

  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const viewerId = getAuthAgentId(auth)
  if (!viewerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const allowed = await canViewDatingPhotoById(viewerId, photo)
  if (!allowed) return NextResponse.json({ error: "Access denied" }, { status: 403 })

  try {
    return await streamPhotoResponse(photo)
  } catch {
    return NextResponse.json({ error: "Failed to load image" }, { status: 502 })
  }
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
