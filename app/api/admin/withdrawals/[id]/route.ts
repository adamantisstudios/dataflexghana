import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { completeWithdrawal, cancelWithdrawal } from "@/lib/commission-earnings"
import { authenticateAdmin } from "@/lib/api-auth"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] Starting withdrawal status update process")

    const authResult = await authenticateAdmin(request)
    console.log("[v0] Auth result:", { success: authResult.success, error: authResult.error })

    if (!authResult.success) {
      return NextResponse.json({ success: false, error: "Admin authentication required" }, { status: 401 })
    }

    const withdrawalId = params.id
    console.log("[v0] Processing withdrawal ID:", withdrawalId)

    const body = await request.json()
    console.log("[v0] Request body:", body)

    const { status, admin_notes } = body

    if (!withdrawalId) {
      return NextResponse.json({ success: false, error: "Withdrawal ID is required" }, { status: 400 })
    }

    if (!status || !["paid", "rejected", "processing", "pending", "cancelled", "requested"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid status is required (paid, rejected, processing, pending, cancelled, requested)",
        },
        { status: 400 },
      )
    }

    console.log(`[v0] Processing withdrawal ${withdrawalId} to status: ${status}`)

    console.log("[v0] Fetching withdrawal from database...")
    const { data: withdrawal, error: fetchError } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single()

    console.log("[v0] Withdrawal fetch result:", { withdrawal: !!withdrawal, error: fetchError })

    if (fetchError) {
      console.error("[v0] Database fetch error details:", {
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        code: fetchError.code,
      })

      // Check if it's a table not found error
      if (fetchError.message?.includes('relation "withdrawals" does not exist') || fetchError.code === "42P01") {
        return NextResponse.json(
          {
            success: false,
            error: "Database table 'withdrawals' does not exist. Please run the database setup script first.",
            details: "Run scripts/create-withdrawals-table.sql in your database",
          },
          { status: 500 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: "Database error occurred",
          details: fetchError.message,
        },
        { status: 500 },
      )
    }

    if (!withdrawal) {
      return NextResponse.json({ success: false, error: "Withdrawal not found" }, { status: 404 })
    }

    const updateData: any = {
      status,
      admin_notes,
      updated_at: new Date().toISOString(),
    }

    if (status === "paid") {
      updateData.paid_at = new Date().toISOString()
    } else if (status === "processing") {
      updateData.processing_at = new Date().toISOString()
    } else if (status === "rejected") {
      updateData.rejected_at = new Date().toISOString()
    } else if (status === "pending") {
      updateData.pending_at = new Date().toISOString()
    } else if (status === "cancelled") {
      updateData.cancelled_at = new Date().toISOString()
    } else if (status === "requested") {
      updateData.requested_at = new Date().toISOString()
    }

    console.log("[v0] Updating withdrawal with data:", updateData)
    const { error: updateError } = await supabase.from("withdrawals").update(updateData).eq("id", withdrawalId)

    if (updateError) {
      console.error("[v0] Database update error details:", {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      })

      return NextResponse.json(
        {
          success: false,
          error: "Failed to update withdrawal status",
          details: updateError.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Withdrawal updated successfully, processing commissions...")
    let commissionResult = { success: true, message: "Status updated successfully" }

    if (status === "paid") {
      console.log("[v0] Calling completeWithdrawal...")
      // This ensures the same commission cannot be withdrawn again
      commissionResult = await completeWithdrawal(withdrawalId)
      console.log("[v0] completeWithdrawal result:", commissionResult)
    } else if (status === "rejected") {
      console.log("[v0] Calling cancelWithdrawal...")
      // This ensures rejected withdrawals don't lose the commission
      commissionResult = await cancelWithdrawal(withdrawalId)
      console.log("[v0] cancelWithdrawal result:", commissionResult)
    }

    if (!commissionResult.success) {
      console.error("[v0] Commission processing failed:", commissionResult.message)
      // Don't fail the entire request, but log the issue
    }

    console.log(`[v0] Withdrawal ${withdrawalId} processed successfully to ${status}`)

    return NextResponse.json({
      success: true,
      message: `Withdrawal ${status} successfully`,
      data: {
        id: withdrawalId,
        status,
        admin_notes,
        commission_processed: commissionResult.success,
      },
    })
  } catch (error) {
    console.error("[v0] Error processing withdrawal:", error)

    let errorMessage = "Failed to process withdrawal"
    let errorDetails = "Unknown error occurred"

    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || error.message
      console.error("[v0] Error stack:", error.stack)

      // Check for specific database connection errors
      if (error.message.includes("connect") || error.message.includes("connection")) {
        errorDetails = "Database connection failed. Check your database configuration."
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: "Admin authentication required" }, { status: 401 })
    }

    const withdrawalId = params.id

    if (!withdrawalId) {
      return NextResponse.json({ success: false, error: "Withdrawal ID is required" }, { status: 400 })
    }

    const { data: withdrawal, error } = await supabase
      .from("withdrawals")
      .select(`*,
        agents (
          id,
          full_name,
          phone_number,
          momo_number
        )
      `)
      .eq("id", withdrawalId)
      .single()

    if (error) {
      console.error("[v0] GET withdrawal error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })

      // Check if it's a table not found error
      if (error.message?.includes('relation "withdrawals" does not exist') || error.code === "42P01") {
        return NextResponse.json(
          {
            success: false,
            error: "Database table 'withdrawals' does not exist. Please run the database setup script first.",
            details: "Run scripts/create-withdrawals-table.sql in your database",
          },
          { status: 500 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: "Database error occurred",
          details: error.message,
        },
        { status: 500 },
      )
    }

    if (!withdrawal) {
      return NextResponse.json({ success: false, error: "Withdrawal not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: withdrawal,
    })
  } catch (error) {
    console.error("❌ Error fetching withdrawal:", error)

    let errorMessage = "Failed to fetch withdrawal"
    let errorDetails = "Unknown error occurred"

    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || error.message
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 },
    )
  }
}
