import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getUnifiedTransactionHistory } from "@/lib/earnings-calculator"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId") || user.id
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 200)

    if (user.role === "agent" && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const transactions = await getUnifiedTransactionHistory(agentId, limit)

    return NextResponse.json({
      success: true,
      transactions,
    })
  } catch (error) {
    console.error("Error in GET /api/agent/wallet/transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
