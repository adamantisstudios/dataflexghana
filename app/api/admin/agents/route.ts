import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase-query"
import { authenticateAdmin } from "@/lib/api-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Admin authentication required" },
        { status: 401 },
      )
    }

    const admin = authResult.user
    console.log("✅ Admin authenticated for agents list:", admin.id)

    const supabase = createSupabaseAdmin()

    const { data: agents, error } = await supabase
      .from("agents")
      .select(
        `
        *,
        users!agents_user_id_fkey (
          email,
          phone,
          created_at
        ),
        data_orders!data_orders_agent_id_fkey (
          id,
          amount,
          status
        ),
        commissions!commissions_agent_id_fkey (
          amount,
          status
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching agents:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch agents" }, { status: 500 })
    }

    const processedAgents = agents.map((agent: any) => ({
      ...agent,
      user_email: agent.users?.email,
      user_phone: agent.users?.phone,
      user_created_at: agent.users?.created_at,
      total_orders: agent.data_orders?.filter((o: any) => o.status === "completed").length || 0,
      total_sales_amount:
        agent.data_orders
          ?.filter((o: any) => o.status === "completed")
          .reduce((sum: number, o: any) => sum + (o.amount || 0), 0) || 0,
      total_commission_earned:
        agent.commissions
          ?.filter((c: any) => c.status === "paid")
          .reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 0,
    }))

    return NextResponse.json({
      success: true,
      agents: processedAgents,
      total: processedAgents.length,
    })
  } catch (error) {
    console.error("❌ Error fetching agents:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch agents" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Admin authentication required" },
        { status: 401 },
      )
    }

    const admin = authResult.user
    console.log("✅ Admin authenticated for agent creation:", admin.id)

    const body = await request.json()

    return NextResponse.json({
      success: true,
      message: "Agent creation functionality would be implemented here",
    })
  } catch (error) {
    console.error("❌ Error creating agent:", error)
    return NextResponse.json({ success: false, error: "Failed to create agent" }, { status: 500 })
  }
}
