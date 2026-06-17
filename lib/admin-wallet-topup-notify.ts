import { logAudit } from "@/lib/audit-logger"
import { getAdminClient } from "@/lib/supabase-base"

export async function notifyAdminManualWalletTopup(params: {
  topupId: string
  agentId: string
  agentName?: string | null
  amount: number
  paymentReference?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<void> {
  const amount = Math.round(params.amount * 100) / 100
  const agentLabel = params.agentName?.trim() || "Agent"
  const ref = params.paymentReference?.trim() || "N/A"
  const preview = `URGENT: Manual wallet top-up GH₵${amount.toFixed(2)} from ${agentLabel} — MoMo ref: ${ref}`

  const db = getAdminClient()

  try {
    await db.from("admin_notifications").insert({
      type: "wallet_topup_manual",
      agent_id: params.agentId,
      submission_id: params.topupId,
      preview,
      read: false,
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error("[admin-wallet-topup-notify] admin_notifications:", e)
  }

  await logAudit({
    actorId: params.agentId,
    actorType: "agent",
    action: "manual_wallet_topup",
    severity: "critical",
    targetTable: "wallet_topups",
    targetId: params.topupId,
    newData: {
      topup_id: params.topupId,
      agent_id: params.agentId,
      agent_name: agentLabel,
      amount,
      payment_reference: ref,
      order_type: "wallet_topup_manual",
      href_tab: "wallets",
    },
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  })
}
