import { logAudit } from "@/lib/audit-logger"
import { getAdminClient } from "@/lib/supabase-base"

/** Alert admin that a new agent was auto-verified and should be spot-checked. */
export async function notifyAdminPhotoVerification(params: {
  agentId: string
  agentName?: string | null
  profileImageUrl?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<void> {
  const agentLabel = params.agentName?.trim() || "Agent"
  const preview = `NEW VERIFIED: ${agentLabel} — auto-approved photo. Open Verified list to check their image (reject/revoke if needed).`

  const db = getAdminClient()

  try {
    await db.from("admin_notifications").insert({
      type: "photo_verification_auto",
      agent_id: params.agentId,
      submission_id: params.agentId,
      preview,
      read: false,
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error("[admin-photo-verification-notify] admin_notifications:", e)
  }

  await logAudit({
    actorId: params.agentId,
    actorType: "agent",
    action: "profile_photo_auto_verified",
    severity: "warning",
    targetTable: "agents",
    targetId: params.agentId,
    newData: {
      agent_id: params.agentId,
      agent_name: agentLabel,
      profile_verified: true,
      status: "verified",
      profile_image_url: params.profileImageUrl ?? null,
      href_tab: "photo-verification",
      filter: "verified",
    },
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  })
}
