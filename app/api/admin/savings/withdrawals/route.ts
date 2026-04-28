import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET - Fetch withdrawal requests for admin
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url || "", "http://localhost")
    const { searchParams } = url
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("withdrawal_requests")
      .select(`
        *,
        agent_savings (
          principal_amount,
          current_balance,
          status,
          savings_plans (
            name,
            early_withdrawal_penalty
          )
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data: requests, error } = await query

    if (error) {
      console.error("Error fetching withdrawal requests:", error)
      return NextResponse.json({ error: "Failed to fetch withdrawal requests" }, { status: 500 })
    }

    // Calculate penalty and net amounts for each request
    const requestsWithCalculations =
      requests?.map((request) => {
        const savings = request.agent_savings
        let penaltyAmount = 0

        if (request.withdrawal_type === "early" && savings?.savings_plans?.early_withdrawal_penalty) {
          penaltyAmount = (request.requested_amount * savings.savings_plans.early_withdrawal_penalty) / 100
        }

        const netAmount = request.requested_amount - penaltyAmount

        return {
          ...request,
          penaltyAmount,
          netAmount,
          formattedRequestedAmount: `₵${request.requested_amount.toFixed(2)}`,
          formattedNetAmount: `₵${netAmount.toFixed(2)}`,
          formattedPenalty: penaltyAmount > 0 ? `₵${penaltyAmount.toFixed(2)}` : null,
          formattedDate: new Date(request.created_at).toLocaleDateString("en-GB", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        }
      }) || []

    return NextResponse.json({ requests: requestsWithCalculations })
  } catch (error) {
    console.error("Error in GET /api/admin/savings/withdrawals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Process withdrawal request (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, action, adminNotes, processedBy } = body

    if (!requestId || !action || !processedBy) {
      return NextResponse.json(
        {
          error: "Request ID, action, and processed by are required",
        },
        { status: 400 },
      )
    }

    if (!["approve", "reject", "mark_paid"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be: approve, reject, or mark_paid" }, { status: 400 })
    }

    // Fetch withdrawal request details
    const { data: withdrawalRequest, error: fetchError } = await supabase
      .from("withdrawal_requests")
      .select(`
        *,
        agent_savings (
          id,
          current_balance,
          status,
          savings_plans (
            early_withdrawal_penalty
          )
        )
      `)
      .eq("id", requestId)
      .single()

    if (fetchError || !withdrawalRequest) {
      return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 })
    }

    // CRITICAL FIX: Prevent processing already paid withdrawals
    if (withdrawalRequest.status === "paid" || withdrawalRequest.is_locked === true) {
      return NextResponse.json(
        {
          error: "This withdrawal has already been paid and is permanently locked. No further actions are allowed.",
        },
        { status: 400 },
      )
    }

    if (withdrawalRequest.status !== "pending" && action !== "mark_paid") {
      return NextResponse.json({ error: "Request has already been processed" }, { status: 400 })
    }

    // CRITICAL FIX: Special handling for mark_paid action
    if (action === "mark_paid") {
      // Only allow marking as paid if status is 'approved' or 'processed'
      if (!["approved", "processed"].includes(withdrawalRequest.status)) {
        return NextResponse.json(
          {
            error: "Can only mark approved or processed withdrawals as paid",
          },
          { status: 400 },
        )
      }

      // CRITICAL FIX: Mark as paid and lock permanently
      const { error: markPaidError } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "paid",
          admin_notes: adminNotes || null,
          processed_by: processedBy,
          processed_at: withdrawalRequest.processed_at || new Date().toISOString(),
          paid_at: new Date().toISOString(),
          payment_reference: `PAY-${Date.now()}-${requestId.slice(0, 8)}`,
          is_locked: true, // CRITICAL: Lock the withdrawal permanently
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (markPaidError) {
        console.error("Error marking withdrawal as paid:", markPaidError)
        return NextResponse.json({ error: "Failed to mark withdrawal as paid" }, { status: 500 })
      }

      // CRITICAL FIX: Clear commission balance - mark all related commission items as paid
      const { error: commissionClearError } = await supabase
        .from("withdrawal_commission_items")
        .update({
          is_paid: true,
          paid_at: new Date().toISOString(),
        })
        .eq("withdrawal_request_id", requestId)
        .eq("is_paid", false)

      if (commissionClearError) {
        console.error("Error clearing commission items:", commissionClearError)
        // Don't fail the request, but log the error
      }

      // CRITICAL FIX: Update agent's totalEarnings to reflect the paid amount
      // This ensures the commission is removed from available balance
      const { data: agentData, error: agentFetchError } = await supabase
        .from("agents")
        .select("totalEarnings")
        .eq("id", withdrawalRequest.agent_id)
        .single()

      if (!agentFetchError && agentData) {
        const newTotalEarnings = (agentData.totalEarnings || 0) + withdrawalRequest.requested_amount

        const { error: agentUpdateError } = await supabase
          .from("agents")
          .update({
            totalEarnings: newTotalEarnings,
            updated_at: new Date().toISOString(),
          })
          .eq("id", withdrawalRequest.agent_id)

        if (agentUpdateError) {
          console.error("Error updating agent totalEarnings:", agentUpdateError)
          // Don't fail the request, but log the error
        }
      }

      // Create final payment transaction
      const { error: paymentTransactionError } = await supabase.from("savings_transactions").insert({
        agent_savings_id: withdrawalRequest.agent_savings_id,
        transaction_type: "payment_completed",
        amount: -withdrawalRequest.requested_amount,
        balance_after: withdrawalRequest.agent_savings.current_balance - withdrawalRequest.requested_amount,
        description: `Payment completed - ${withdrawalRequest.withdrawal_type} withdrawal of ₵${withdrawalRequest.requested_amount}`,
        reference_number: `PAY-${Date.now()}-${requestId.slice(0, 8)}`,
      })

      if (paymentTransactionError) {
        console.error("Error creating payment transaction:", paymentTransactionError)
      }

      return NextResponse.json({
        message: "Withdrawal marked as paid successfully and permanently locked. Commission balance has been cleared.",
        locked: true,
      })
    }

    // Handle regular approve/reject actions
    const newStatus = action === "approve" ? "approved" : "rejected"

    // Update withdrawal request
    const { error: updateError } = await supabase
      .from("withdrawal_requests")
      .update({
        status: newStatus,
        admin_notes: adminNotes || null,
        processed_by: processedBy,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)

    if (updateError) {
      console.error("Error updating withdrawal request:", updateError)
      return NextResponse.json({ error: "Failed to process withdrawal request" }, { status: 500 })
    }

    // If approved, create transaction and update savings balance
    if (action === "approve") {
      const savings = withdrawalRequest.agent_savings
      let penaltyAmount = 0

      if (withdrawalRequest.withdrawal_type === "early" && savings?.savings_plans?.early_withdrawal_penalty) {
        penaltyAmount = (withdrawalRequest.requested_amount * savings.savings_plans.early_withdrawal_penalty) / 100
      }

      const netAmount = withdrawalRequest.requested_amount - penaltyAmount
      const newBalance = savings.current_balance - withdrawalRequest.requested_amount

      // Update savings balance
      const { error: balanceError } = await supabase
        .from("agent_savings")
        .update({
          current_balance: newBalance,
          status: withdrawalRequest.withdrawal_type === "full" ? "withdrawn" : "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", savings.id)

      if (balanceError) {
        console.error("Error updating savings balance:", balanceError)
        // Note: We don't return error here as the request was already approved
      }

      // Create withdrawal transaction
      const { error: transactionError } = await supabase.from("savings_transactions").insert({
        agent_savings_id: savings.id,
        transaction_type: "withdrawal",
        amount: -withdrawalRequest.requested_amount,
        balance_after: newBalance,
        description: `Withdrawal processed - ${withdrawalRequest.withdrawal_type}`,
        reference_number: `WTH-${Date.now()}-${requestId.slice(0, 8)}`,
      })

      if (transactionError) {
        console.error("Error creating withdrawal transaction:", transactionError)
      }

      // Create penalty transaction if applicable
      if (penaltyAmount > 0) {
        const { error: penaltyError } = await supabase.from("savings_transactions").insert({
          agent_savings_id: savings.id,
          transaction_type: "penalty",
          amount: -penaltyAmount,
          balance_after: newBalance,
          description: `Early withdrawal penalty (${savings.savings_plans.early_withdrawal_penalty}%)`,
          reference_number: `PEN-${Date.now()}-${requestId.slice(0, 8)}`,
        })

        if (penaltyError) {
          console.error("Error creating penalty transaction:", penaltyError)
        }
      }
    }

    return NextResponse.json({
      message: `Withdrawal request ${action}d successfully`,
    })
  } catch (error) {
    console.error("Error in PUT /api/admin/savings/withdrawals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
