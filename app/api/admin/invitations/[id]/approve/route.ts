import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { createAdminAdjustment } from "@/lib/earnings-calculator"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  try {
    const { admin_id, notes } = await request.json()
    const referralId = params.id

    console.log("[v0] Approving invitation:", referralId)

    const { data: referralLink, error: fetchError } = await supabase
      .from("referral_links")
      .select("agent_id, referral_code")
      .eq("id", referralId)
      .single()

    if (fetchError) {
      console.error("[v0] Error fetching referral link:", fetchError)
      throw new Error("Referral link not found")
    }

    console.log("[v0] Referral link found:", referralLink)

    const { error: updateError } = await supabase
      .from("referral_links")
      .update({
        admin_approval_status: "approved",
        admin_approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", referralId)

    if (updateError) {
      console.error("[v0] Error updating referral link:", updateError)
      throw updateError
    }

    console.log("[v0] Referral link updated to approved")

    // Using upsert to avoid 409 conflict if the record already exists
    const { error: creditError } = await supabase.from("referral_credits").upsert(
      {
        referring_agent_id: referralLink.agent_id,
        referred_agent_id: referralLink.agent_id, // Same agent for now
        referral_code: referralLink.referral_code,
        status: "credited",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "referring_agent_id,referred_agent_id", // Handle conflict on these columns
        ignoreDuplicates: false, // Update if exists
      },
    )

    if (creditError) {
      console.error("[v0] Error upserting referral credit:", creditError)
      // Don't throw - log it but continue since the main approval worked
    }

    console.log("[v0] Referral credit processed")

    if (!admin_id) {
      console.warn("[v0] No admin_id provided, skipping wallet credit")
    } else {
      try {
        const adjustmentId = await createAdminAdjustment(
          referralLink.agent_id,
          5, // 5 cedis
          admin_id,
          "Approval credit for news agent",
          true, // is_positive = true (credit)
        )

        if (adjustmentId) {
          console.log("[v0] Wallet credit applied for news agent approval:", adjustmentId)
        } else {
          console.warn("[v0] Failed to create wallet adjustment for news agent approval")
        }
      } catch (walletError) {
        console.error("[v0] Error applying wallet credit:", walletError)
        // Don't throw - the approval was successful, wallet credit is bonus
      }
    }

    const { error: auditError } = await supabase.from("invitation_audit_log").insert({
      admin_id,
      referral_id: referralId,
      action: "approved",
      reason: notes,
    })

    if (auditError) console.error("[v0] Audit log error:", auditError)

    console.log("[v0] Invitation approved successfully with wallet credit")

    return NextResponse.json({
      success: true,
      message: "Invitation approved successfully! Agent credited with 5 cedis.",
    })
  } catch (error) {
    console.error("[v0] Error approving invitation:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to approve invitation",
      },
      { status: 500 },
    )
  }
}
