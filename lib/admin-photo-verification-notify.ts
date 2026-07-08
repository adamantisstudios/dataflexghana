import { logAudit } from "@/lib/audit-logger"
import { getAdminClient } from "@/lib/supabase-base"

export type PhotoVerificationNotifyKind = "auto_verified" | "pending_review"

export async function notifyAdminPhotoVerification(params: {
  agentId: string
  agentName?: string | null
  kind: PhotoVerificationNotifyKind
  profileImageUrl?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<void> {
  const agentLabel = params.agentName?.trim() || "Agent"
  const isAuto = params.kind === "auto_verified"
  const preview = isAuto
    ? `REVIEW: ${agentLabel} was auto-verified (photo). Check verified list — reject/revoke if needed.`
    : `REVIEW: ${agentLabel} submitted a profile photo pending your approval.`

  const db = getAdminClient()

  try {
    await db.from("admin_notifications").insert({
      type: isAuto ? "photo_verification_auto" : "photo_verification_pending",
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
    action: isAuto ? "profile_photo_auto_verified" : "profile_photo_pending",
    severity: "warning",
    targetTable: "agents",
    targetId: params.agentId,
    newData: {
      agent_id: params.agentId,
      agent_name: agentLabel,
      profile_verified: isAuto,
      status: isAuto ? "verified" : "pending",
      profile_image_url: params.profileImageUrl ?? null,
      href_tab: "photo-verification",
      filter: isAuto ? "verified" : "pending",
    },
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  })
}
