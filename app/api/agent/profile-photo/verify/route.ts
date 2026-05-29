import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { submitAgentProfilePhotoForReview } from "@/lib/agent-profile-photo"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) {
    return createAuthErrorResponse(auth.error || "Agent authentication required")
  }

  const agentId = getAuthAgentId(auth)
  if (!agentId) {
    return NextResponse.json({ error: "Agent authentication required" }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const profile_image_url = body.profile_image_url
      ? String(body.profile_image_url).trim()
      : undefined

    if (!profile_image_url) {
      return NextResponse.json({ error: "profile_image_url is required" }, { status: 400 })
    }

    const result = await submitAgentProfilePhotoForReview(agentId, profile_image_url)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile_verified: false, pending: true })
  } catch (e) {
    console.error("[profile-photo/verify]", e)
    return NextResponse.json({ error: "Failed to verify profile photo" }, { status: 500 })
  }
}
