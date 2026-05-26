import { getAdminClient } from "@/lib/supabase-base"
import { createAdminAdjustment } from "@/lib/earnings-calculator"

/** Agent-to-agent signup referral reward (GHS). */
export const REFERRAL_CREDIT_AMOUNT = 5

export async function findReferringAgentIdByCode(referralCode: string): Promise<string | null> {
  if (!referralCode?.trim()) return null

  const db = getAdminClient()
  const { data: link } = await db
    .from("referral_links")
    .select("agent_id")
    .eq("referral_code", referralCode.trim())
    .eq("status", "active")
    .maybeSingle()

  return link?.agent_id ?? null
}

/** After a new agent registers with ?ref=, link them to referrer (pending until referred agent is approved). */
export async function linkReferredAgentRegistration(
  referredAgentId: string,
  signupReferralCode: string,
): Promise<{ success: boolean; message: string }> {
  const referringAgentId = await findReferringAgentIdByCode(signupReferralCode)
  if (!referringAgentId) {
    return { success: false, message: "Invalid referral code" }
  }

  if (referringAgentId === referredAgentId) {
    return { success: false, message: "Cannot refer yourself" }
  }

  const db = getAdminClient()

  const { data: existing } = await db
    .from("referral_credits")
    .select("id")
    .eq("referred_agent_id", referredAgentId)
    .maybeSingle()

  if (existing) {
    return { success: true, message: "Referral already linked" }
  }

  const { error } = await db.from("referral_credits").insert({
    referring_agent_id: referringAgentId,
    referred_agent_id: referredAgentId,
    credit_amount: REFERRAL_CREDIT_AMOUNT,
    status: "pending",
    notes: `Signup via referral code ${signupReferralCode}`,
  })

  if (error) {
    console.error("linkReferredAgentRegistration:", error)
    return { success: false, message: error.message }
  }

  return { success: true, message: "Referral linked" }
}

/** When admin approves a referred agent, ensure invitation row exists for Invitation Management. */
export async function ensureReferralCreditOnAgentApproval(referredAgentId: string): Promise<void> {
  const db = getAdminClient()

  const { data: agent } = await db
    .from("agents")
    .select("id, referral_code, full_name")
    .eq("id", referredAgentId)
    .single()

  if (!agent?.referral_code) return

  const referringAgentId = await findReferringAgentIdByCode(agent.referral_code)
  if (!referringAgentId) return

  const { data: existing } = await db
    .from("referral_credits")
    .select("id, status")
    .eq("referred_agent_id", referredAgentId)
    .maybeSingle()

  if (existing) {
    if (existing.status === "pending") {
      await db
        .from("referral_credits")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
    }
    return
  }

  await db.from("referral_credits").insert({
    referring_agent_id: referringAgentId,
    referred_agent_id: referredAgentId,
    credit_amount: REFERRAL_CREDIT_AMOUNT,
    status: "confirmed",
    confirmed_at: new Date().toISOString(),
    notes: `Referred agent ${agent.full_name} approved`,
  })
}

/** Credit referring agent wallet when admin marks invitation as credited. */
export async function creditReferringAgentForReferral(
  referralCreditId: string,
  adminId: string,
): Promise<{ success: boolean; message: string }> {
  const db = getAdminClient()

  const { data: credit, error } = await db
    .from("referral_credits")
    .select("*")
    .eq("id", referralCreditId)
    .single()

  if (error || !credit) {
    return { success: false, message: "Referral credit not found" }
  }

  if (credit.status === "credited" || credit.status === "paid_out") {
    return { success: false, message: "Referral already credited" }
  }

  const adjustmentId = await createAdminAdjustment(
    credit.referring_agent_id,
    Number(credit.credit_amount) || REFERRAL_CREDIT_AMOUNT,
    adminId,
    `Referral reward for inviting agent (credit ${referralCreditId.slice(0, 8)})`,
    true,
  )

  if (!adjustmentId) {
    return { success: false, message: "Failed to credit referrer wallet" }
  }

  await db
    .from("referral_credits")
    .update({
      status: "credited",
      credited_at: new Date().toISOString(),
    })
    .eq("id", referralCreditId)

  return { success: true, message: "Referrer credited successfully" }
}
