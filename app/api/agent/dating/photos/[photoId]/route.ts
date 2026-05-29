import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { deleteProfilePhoto, getPhotoById } from "@/lib/dating/dating-photos-server"
import { getDatingProfile, recalculateProfileCompleteness } from "@/lib/dating/dating-server"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { photoId } = await params
  try {
    const photo = await getPhotoById(photoId)
    if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 })

    await deleteProfilePhoto(photoId, agentId)
    const profile = await getDatingProfile(agentId)
    if (profile) {
      const completeness = await recalculateProfileCompleteness(profile.id)
      await getAdminClient()
        .from("dating_profiles")
        .update({ profile_completeness: completeness, updated_at: new Date().toISOString() })
        .eq("id", profile.id)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 },
    )
  }
}
