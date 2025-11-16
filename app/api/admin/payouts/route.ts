import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { processWithdrawalPayout, getWithdrawalWithCommissionSources } from "@/lib/wholesale"

export async function GET(request: NextRequest) {
  try {
    // Get all pending withdrawal requests with commission sources
    const { data: withdrawals, error } = await supabase
      .from("withdrawals")
      .select(`
        *,
        agents:agent_id (
          id,
          name,
          email,
          phone,
          momo_number
        )
      `)
      .in("status", ["requested", "processing"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching pending withdrawals:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch pending withdrawals" }, { status: 500 })
    }

    // Enrich each withdrawal with commission sources
    const enrichedWithdrawals = await Promise.all(
      (withdrawals || []).map(async (withdrawal) => {
        const enrichedWithdrawal = await getWithdrawalWithCommissionSources(withdrawal.id)
        return enrichedWithdrawal || withdrawal
      }),
    )

    return NextResponse.json({
      success: true,
      withdrawals: enrichedWithdrawals,
    })
  } catch (error: any) {
    console.error("Error in admin payouts GET API:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch payout data",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { withdrawal_id, admin_id, payout_reference, action } = body

    if (!withdrawal_id) {
      return NextResponse.json({ success: false, error: "Withdrawal ID is required" }, { status: 400 })
    }

    if (!admin_id) {
      return NextResponse.json({ success: false, error: "Admin ID is required" }, { status: 400 })
    }

    if (action === "approve" || action === "pay") {
      // CRITICAL FIX: Use secure withdrawal processing to prevent double spending
      console.log("🔒 Processing secure withdrawal payout via API:", { withdrawal_id, admin_id })

      try {
        const result = await processWithdrawalPayout(withdrawal_id, admin_id, payout_reference)

        if (result) {
          const { completeWithdrawal } = await import("@/lib/commission-earnings")
          await completeWithdrawal(withdrawal_id)

          console.log("✅ Secure withdrawal payout completed successfully")
          return NextResponse.json({
            success: true,
            message:
              "Withdrawal payout processed securely. Commission balance updated, wallet balance unchanged (money paid out externally).",
          })
        } else {
          console.error("❌ Secure withdrawal processing returned false")
          return NextResponse.json({ success: false, error: "Secure withdrawal processing failed" }, { status: 500 })
        }
      } catch (secureProcessingError: any) {
        console.error("❌ Error in secure withdrawal processing:", secureProcessingError)
        return NextResponse.json(
          {
            success: false,
            error: "Secure withdrawal processing failed",
            details: secureProcessingError.message || "Unknown error",
          },
          { status: 500 },
        )
      }
    } else if (action === "reject") {
      // Reject the withdrawal
      const { error } = await supabase
        .from("withdrawals")
        .update({
          status: "rejected",
          admin_notes: body.admin_notes || "Withdrawal rejected by admin",
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawal_id)

      if (error) {
        console.error("Error rejecting withdrawal:", error)
        return NextResponse.json({ success: false, error: "Failed to reject withdrawal" }, { status: 500 })
      }

      // Unlock the commission sources by clearing withdrawal links
      await supabase
        .from("referrals")
        .update({
          withdrawal_id: null,
          commission_withdrawn: false,
          withdrawn_at: null,
        })
        .eq("withdrawal_id", withdrawal_id)

      await supabase
        .from("data_orders")
        .update({
          withdrawal_id: null,
          commission_withdrawn: false,
          withdrawn_at: null,
        })
        .eq("withdrawal_id", withdrawal_id)

      await supabase
        .from("wholesale_orders")
        .update({
          withdrawal_id: null,
          commission_withdrawn: false,
          withdrawn_at: null,
        })
        .eq("withdrawal_id", withdrawal_id)

      return NextResponse.json({
        success: true,
        message: "Withdrawal rejected successfully",
      })
    } else {
      return NextResponse.json({ success: false, error: "Invalid action specified" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Error in admin payouts POST API:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process payout action",
      },
      { status: 500 },
    )
  }
}
