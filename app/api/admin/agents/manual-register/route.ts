import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { hashPassword } from "@/lib/supabase"
import { withAdminAuth } from "@/lib/api-auth"
import { createAdminAdjustment } from "@/lib/earnings-calculator"
import { ensureReferralCreditOnAgentApproval } from "@/lib/referral-agent-program"

export const dynamic = "force-dynamic"

export const POST = withAdminAuth(async (request: NextRequest, admin) => {
  try {
    const body = await request.json()
    const {
      fullName,
      phoneNumber,
      momoNumber,
      region,
      password,
      autoApprove = false,
      adminNotes = "",
    } = body as {
      fullName?: string
      phoneNumber?: string
      momoNumber?: string
      region?: string
      password?: string
      autoApprove?: boolean
      adminNotes?: string
    }

    if (!fullName?.trim() || !phoneNumber?.trim() || !momoNumber?.trim() || !region?.trim() || !password) {
      return NextResponse.json(
        { success: false, error: "Full name, phone, MoMo number, region, and password are required" },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long" },
        { status: 400 },
      )
    }

    const db = getAdminClient()
    const normalizedPhone = phoneNumber.trim()

    const { data: existingAgent } = await db
      .from("agents")
      .select("id")
      .eq("phone_number", normalizedPhone)
      .maybeSingle()

    if (existingAgent) {
      return NextResponse.json(
        { success: false, error: "An agent with this phone number already exists" },
        { status: 409 },
      )
    }

    const passwordHash = await hashPassword(password)

    const { data: newAgent, error: insertError } = await db
      .from("agents")
      .insert({
        full_name: fullName.trim(),
        agent_name: fullName.trim(),
        phone_number: normalizedPhone,
        momo_number: momoNumber.trim(),
        region: region.trim(),
        password_hash: passwordHash,
        isapproved: Boolean(autoApprove),
        registration_source: "manual_admin",
        registered_by_admin_id: admin.id,
        admin_notes: adminNotes?.trim() || null,
      })
      .select("id, full_name, phone_number, momo_number, region, isapproved, created_at")
      .single()

    if (insertError || !newAgent) {
      console.error("[manual-register] insert failed:", insertError)
      return NextResponse.json(
        { success: false, error: insertError?.message || "Failed to create agent" },
        { status: 500 },
      )
    }

    await db.from("admin_agent_registrations").insert({
      agent_id: newAgent.id,
      registered_by_admin_id: admin.id,
      registration_method: "manual",
      registration_notes: adminNotes?.trim() || null,
    })

    if (autoApprove) {
      try {
        const adjustmentId = await createAdminAdjustment(
          newAgent.id,
          5,
          admin.id,
          "Approval credit for manually registered agent",
          true,
        )

        if (!adjustmentId) {
          return NextResponse.json(
            {
              success: true,
              warning: "Agent created but welcome wallet credit failed",
              agent: newAgent,
            },
            { status: 201 },
          )
        }

        try {
          await ensureReferralCreditOnAgentApproval(newAgent.id)
        } catch (referralErr) {
          console.error("[manual-register] referral credit:", referralErr)
        }
      } catch (creditErr) {
        console.error("[manual-register] welcome wallet credit:", creditErr)
        const msg = creditErr instanceof Error ? creditErr.message : "Wallet credit failed"
        return NextResponse.json(
          {
            success: true,
            warning: `Agent created but welcome wallet credit failed: ${msg}`,
            agent: newAgent,
          },
          { status: 201 },
        )
      }
    }

    return NextResponse.json(
      {
        success: true,
        agent: newAgent,
        message: `Agent "${newAgent.full_name}" created successfully.${
          autoApprove ? " Account is approved and ready to use." : " Account requires approval before activation."
        }`,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[manual-register] error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to register agent",
      },
      { status: 500 },
    )
  }
})
