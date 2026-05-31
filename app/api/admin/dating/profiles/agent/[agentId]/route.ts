import { type NextRequest, NextResponse } from "next/server"
import { authenticateAdmin } from "@/lib/api-auth"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { deleteDatingAccountByAgentId } from "@/lib/dating/delete-dating-account"

export const dynamic = "force-dynamic"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 })

  const { agentId } = await params
  if (!agentId?.trim()) {
    return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
  }

  try {
    const result = await deleteDatingAccountByAgentId(agentId.trim())

    const adminId = auth.user?.id ?? "admin"
    await logAuditFromRequest(request, {
      actorId: adminId,
      actorType: "admin",
      action: "dating_profile_deleted",
      severity: "warning",
      targetTable: "dating_profiles",
      targetId: result.profileId,
      newData: {
        agent_id: result.agentId,
        photos_removed: result.photosRemoved,
      },
    }).catch((e) => console.error("[admin/dating DELETE] audit log failed:", e))

    return NextResponse.json({
      success: true,
      message: "Dating profile deleted",
      ...result,
    })
  } catch (e) {
    const statusCode = (e as Error & { statusCode?: number }).statusCode
    if (statusCode === 404 || (e instanceof Error && e.message === "Dating profile not found")) {
      return NextResponse.json({ error: "Dating profile not found" }, { status: 404 })
    }
    console.error("[admin/dating/profiles/agent DELETE]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete profile" },
      { status: 500 },
    )
  }
}
