import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { meetsConstraints } from "@/lib/commission-calculation"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId")

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    // Get commission summary from the centralized commissions table
    const { data: commissions, error: commissionsError } = await supabase
      .from("commissions")
      .select("*")
      .eq("agent_id", agentId)

    if (commissionsError) {
      console.error("Error fetching commissions:", commissionsError)
      return NextResponse.json({ error: "Failed to fetch commissions" }, { status: 500 })
    }

    let totalEarned = 0
    let totalPending = 0
    let totalWithdrawn = 0
    let availableBalance = 0
    let totalCommissions = 0
    let invalidCount = 0

    if (commissions && Array.isArray(commissions)) {
      for (const c of commissions) {
        let amount = c.amount || 0

        const validation = meetsConstraints(amount)
        if (!validation.valid) {
          invalidCount++
          console.warn(`⚠️ Commission constraint violation: ${validation.error}`)
          // Auto-correct to valid range
          amount = Math.max(0.01, Math.min(0.4, amount))
        }

        totalCommissions += amount

        if (c.status === "earned" || c.status === "pending_withdrawal" || c.status === "withdrawn") {
          totalEarned += amount
        }
        if (c.status === "pending") {
          totalPending += amount
        }
        if (c.status === "withdrawn") {
          totalWithdrawn += amount
        }
      }
    }

    availableBalance =
      commissions
        ?.filter((c) => c.status === "earned")
        .reduce((sum, c) => {
          let amount = c.amount || 0
          const validation = meetsConstraints(amount)
          if (!validation.valid) {
            amount = Math.max(0.01, Math.min(0.4, amount))
          }
          return sum + amount
        }, 0) || 0

    if (invalidCount > 0) {
      console.warn(`⚠️ Found ${invalidCount} commissions with constraint violations`)
    }

    let fallbackData = null
    if (totalCommissions === 0) {
      console.log("No commissions found in commissions table, falling back to legacy calculation")

      // Get agent's legacy commission data
      const { data: agentData, error: agentError } = await supabase
        .from("agents")
        .select("totalcommissions, totalpaidout")
        .eq("id", agentId)
        .single()

      if (!agentError && agentData) {
        const legacyTotal = Number(agentData.totalcommissions) || 0
        const legacyPaidOut = Number(agentData.totalpaidout) || 0

        // Get pending withdrawals
        const { data: pendingWithdrawals } = await supabase
          .from("withdrawals")
          .select("amount")
          .eq("agent_id", agentId)
          .in("status", ["requested", "processing"])

        const pendingPayout = pendingWithdrawals?.reduce((sum, w) => sum + (Number(w.amount) || 0), 0) || 0

        fallbackData = {
          totalEarned: legacyTotal,
          totalPending: 0,
          totalWithdrawn: legacyPaidOut,
          availableBalance: Math.max(0, legacyTotal - legacyPaidOut - pendingPayout),
          totalCommissions: legacyTotal,
          pendingPayout,
        }

        console.log("Using legacy commission data:", fallbackData)
      }
    }

    // Get recent commissions (last 10)
    const recentCommissions =
      commissions
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map((c) => ({
          id: c.id,
          amount: c.amount || 0,
          type: c.source_type || "unknown",
          status: c.status || "pending",
          createdAt: c.created_at,
          sourceId: c.source_id,
        })) || []

    const responseData = fallbackData || {
      totalEarned,
      totalPending,
      totalWithdrawn,
      availableBalance,
      totalCommissions,
    }

    return NextResponse.json({
      ...responseData,
      recentCommissions,
    })
  } catch (error) {
    console.error("Error in commission summary API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
