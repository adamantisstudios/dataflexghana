import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-base";
import { verifyPassword } from "@/lib/supabase";
import { logAuditFromRequest, getClientIp } from "@/lib/audit-logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { phone_number, password } = await request.json();

    if (!phone_number || !password) {
      return NextResponse.json({ error: "Phone number and password are required" }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data: agent, error } = await supabase
      .from("agents")
      .select("*")
      .eq("phone_number", phone_number)
      .single();

    if (error || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (!agent.isapproved) {
      return NextResponse.json({ error: "Account pending approval" }, { status: 403 });
    }

    if (!agent.password_hash || !(await verifyPassword(password, agent.password_hash))) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const clientIp = getClientIp(request);
    if (clientIp) {
      await supabase
        .from("agents")
        .update({ last_ip: clientIp, updated_at: new Date().toISOString() })
        .eq("id", agent.id);
    }

    const { password_hash: _removed, ...safeAgent } = agent;

    await logAuditFromRequest(request, {
      actorId: agent.id,
      actorType: "agent",
      action: "agent_login",
      targetTable: "agents",
      targetId: agent.id,
    });

    return NextResponse.json({ agent: safeAgent });
  } catch (error) {
    console.error("[api/agent/login] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 500 }
    );
  }
}
