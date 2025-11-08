import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

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
    const { admin_id, status } = await request.json()
    const creditId = params.id

    console.log("[v0] Updating referral credit status to:", status)

    const { data: referralCredit, error: fetchError } = await supabase
      .from("referral_credits")
      .select("*")
      .eq("id", creditId)
      .single()

    if (fetchError || !referralCredit) {
      console.error("[v0] Error fetching referral credit:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: "Referral credit not found",
        },
        { status: 404 },
      )
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === "confirmed") {
      updateData.confirmed_at = new Date().toISOString()
    } else if (status === "credited") {
      updateData.credited_at = new Date().toISOString()
    } else if (status === "paid_out") {
      updateData.paid_out_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase.from("referral_credits").update(updateData).eq("id", creditId)

    if (updateError) {
      console.error("[v0] Error updating referral credit:", updateError)
      throw updateError
    }

    console.log("[v0] Referral credit status updated successfully to:", status)

    console.log("[v0] Status change will be picked up by agent refresh cycle")

    if (status === "credited" && referralCredit.credit_amount) {
      console.log("[v0] Creating commission for credited referral:", {
        creditId,
        agentId: referralCredit.referring_agent_id,
        amount: referralCredit.credit_amount,
      })

      const { error: commissionError } = await supabase.from("commissions").insert([
        {
          agent_id: referralCredit.referring_agent_id,
          source_type: "referral_credit",
          source_id: creditId,
          amount: referralCredit.credit_amount,
          status: "earned",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])

      if (commissionError) {
        console.error("[v0] Error creating commission record:", commissionError)
        // Log but don't fail - the status update succeeded
      } else {
        console.log("[v0] Commission record created successfully")

        const { data: agent, error: agentError } = await supabase
          .from("agents")
          .select("totalCommissions")
          .eq("id", referralCredit.referring_agent_id)
          .single()

        if (!agentError && agent) {
          const currentCommissions = Number(agent.totalCommissions) || 0
          const newTotal = currentCommissions + referralCredit.credit_amount

          await supabase
            .from("agents")
            .update({
              totalCommissions: newTotal,
              updated_at: new Date().toISOString(),
            })
            .eq("id", referralCredit.referring_agent_id)

          console.log("[v0] Agent commission balance updated:", {
            agentId: referralCredit.referring_agent_id,
            previousTotal: currentCommissions,
            newTotal,
          })
        }
      }
    }

    if (status === "paid_out") {
      console.log("[v0] Marking commission as paid out for referral:", creditId)

      const { error: withdrawError } = await supabase
        .from("commissions")
        .update({
          status: "withdrawn",
          updated_at: new Date().toISOString(),
        })
        .eq("source_id", creditId)
        .eq("source_type", "referral_credit")

      if (withdrawError) {
        console.error("[v0] Error marking commission as withdrawn:", withdrawError)
        // Log but don't fail - the status update succeeded
      } else {
        console.log("[v0] Commission marked as withdrawn")
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment status updated successfully",
      updatedStatus: status,
      updatedAt: updateData.updated_at,
    })
  } catch (error) {
    console.error("[v0] Error updating status:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update status",
      },
      { status: 500 },
    )
  }
}
