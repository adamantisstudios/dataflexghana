import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getDatingProfile } from "@/lib/dating/dating-server"
import { reorderProfilePhotos } from "@/lib/dating/dating-photos"

export const dynamic = "force-dynamic"

export async function PUT(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const orderedIds = Array.isArray(body.photo_ids) ? body.photo_ids.map(String) : []
    if (orderedIds.length === 0) {
      return NextResponse.json({ error: "photo_ids array required" }, { status: 400 })
    }

    const profile = await getDatingProfile(agentId)
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

    const photos = await reorderProfilePhotos(profile.id, agentId, orderedIds)
    return NextResponse.json({ success: true, photos })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reorder failed" },
      { status: 500 },
    )
  }
}
