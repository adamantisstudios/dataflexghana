import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-base";
import { authenticateAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = getAdminClient();
    const { data: agents, error } = await supabase
      .from("agents")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: atRiskData } = await supabase
      .from("agents")
      .select("id, full_name, phone_number, last_activity_at, data_orders_count_7d, data_orders_count_30d")
      .lt("last_activity_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10);

    const { data: statsData } = await supabase
      .from("agent_automation_logs")
      .select("id")
      .eq("run_type", "scheduled")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const atRisk = (atRiskData || []).map((agent) => ({
      agent_id: agent.id,
      agent_name: agent.full_name,
      phone_number: agent.phone_number,
      last_activity_at: agent.last_activity_at,
      days_since_activity: agent.last_activity_at
        ? Math.floor((Date.now() - new Date(agent.last_activity_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      orders_7d: agent.data_orders_count_7d || 0,
      orders_30d: agent.data_orders_count_30d || 0,
      risk_level: agent.data_orders_count_7d === 0 ? "HIGH" : "MEDIUM",
      risk_reason: agent.data_orders_count_7d === 0 ? "No orders in last 7 days" : "Low activity",
    }));

    return NextResponse.json({
      agents: agents || [],
      stats: statsData || null,
      atRisk,
    });
  } catch (error) {
    console.error("[api/admin/agents/list] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list agents" },
      { status: 500 }
    );
  }
}
