import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { computeAgentCommissionSummary } from "@/lib/commission-summary-server"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId") || user.id
    const statusFilter = searchParams.get("status")

    if (user.role === "agent" && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const db = getAdminClient()

    let query = db
      .from("withdrawals")
      .select("*")
      .eq("agent_id", agentId)
      .order("requested_at", { ascending: false })

    if (statusFilter === "pending") {
      query = query.in("status", ["requested", "processing"])
    } else if (statusFilter) {
      query = query.eq("status", statusFilter)
    }

    const [{ data: withdrawals, error }, summary] = await Promise.all([
      query,
      computeAgentCommissionSummary(db, agentId),
    ])

    if (error) {
      console.error("Error fetching withdrawals:", error)
      return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 })
    }

    const pendingWithdrawals = (withdrawals || []).filter((w) =>
      ["requested", "processing", "pending"].includes(w.status),
    )

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthlyWithdrawalCount = (withdrawals || []).filter((w) => {
      const d = new Date(w.requested_at)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    }).length

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals || [],
      pendingWithdrawals,
      hasPendingWithdrawal: pendingWithdrawals.length > 0,
      monthlyWithdrawalCount,
      summary: {
        availableForWithdrawal: summary.availableForWithdrawal,
        totalEarned: summary.totalEarned,
        totalWithdrawn: summary.totalWithdrawn,
        pendingWithdrawal: summary.pendingWithdrawal,
        referralCommissions: summary.referralCommissions,
        dataOrderCommissions: summary.dataOrderCommissions,
        wholesaleCommissions: summary.wholesaleCommissions,
        breakdown: summary.breakdown,
      },
      breakdown: [
        { source_type: "referral", total_amount: summary.referralCommissions },
        { source_type: "data_order", total_amount: summary.dataOrderCommissions },
        { source_type: "wholesale_order", total_amount: summary.wholesaleCommissions },
      ],
    })
  } catch (error) {
    console.error("Error in GET /api/agent/withdrawals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
