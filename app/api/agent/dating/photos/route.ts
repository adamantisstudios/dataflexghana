import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getDatingProfile } from "@/lib/dating/dating-server"
import { getPhotosForProfile } from "@/lib/dating/dating-photos"

export const dynamic = "force-dynamic"

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

/** List authenticated agent's dating photos (upload via POST /api/agent/dating/upload). */
export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return jsonError("Unauthorized", 401)

  const profile = await getDatingProfile(agentId)
  if (!profile) return NextResponse.json({ success: true, photos: [] })

  const photos = await getPhotosForProfile(profile.id)
  return NextResponse.json({ success: true, photos })
}
