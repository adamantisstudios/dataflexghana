import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, authenticateAdmin, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { canViewDatingPhotoById, getPhotoById } from "@/lib/dating/dating-photos"
import { fetchObjectFromR2Worker } from "@/lib/dating/dating-r2-worker"

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
  if (!adminAuth.success) {
    const auth = await authenticateAgent(request)
    if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
    const viewerId = getAuthAgentId(auth)
    if (!viewerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const allowed = await canViewDatingPhotoById(viewerId, photo)
    if (!allowed) return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  try {
    const workerRes = await fetchObjectFromR2Worker(photo.storage_path)
    if (!workerRes.ok) {
      console.error("[dating/photos/serve] Worker GET failed:", {
        photoId: photo.id,
        storage_path: photo.storage_path,
        status: workerRes.status,
      })
      return NextResponse.json({ error: "Image missing in storage" }, { status: 404 })
    }

    const headers = new Headers(workerRes.headers)
    headers.set("Cache-Control", "private, max-age=3600")
    if (!headers.get("Content-Type")) {
      headers.set("Content-Type", "image/jpeg")
    }

    return new NextResponse(workerRes.body, { status: 200, headers })
  } catch (err) {
    console.error("[dating/photos/serve] stream failed:", {
      photoId: photo.id,
      storage_path: photo.storage_path,
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: "Failed to load image" }, { status: 502 })
  }
}
