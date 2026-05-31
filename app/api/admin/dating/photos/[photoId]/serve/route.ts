import { type NextRequest, NextResponse } from "next/server"
import { authenticateAdmin } from "@/lib/api-auth"
import { getPhotoById } from "@/lib/dating/dating-photos"
import { fetchObjectFromR2Worker } from "@/lib/dating/dating-r2-worker"

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

  try {
    const workerRes = await fetchObjectFromR2Worker(photo.storage_path)
    if (!workerRes.ok) {
      return NextResponse.json({ error: "Image missing in storage" }, { status: 404 })
    }

    const headers = new Headers(workerRes.headers)
    headers.set("Cache-Control", "private, max-age=3600")
    if (!headers.get("Content-Type")) {
      headers.set("Content-Type", "image/jpeg")
    }

    return new NextResponse(workerRes.body, { status: 200, headers })
  } catch (err) {
    console.error("[admin/dating/photos/serve]", err)
    return NextResponse.json({ error: "Failed to load image" }, { status: 502 })
  }
}
