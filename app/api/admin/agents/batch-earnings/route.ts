import { NextRequest, NextResponse } from "next/server";
import { batchCalculateAgentEarnings } from "@/lib/earnings-calculator";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { agentIds } = await request.json();

    if (!Array.isArray(agentIds) || agentIds.length === 0) {
      return NextResponse.json({ earnings: {} });
    }

    const map = await batchCalculateAgentEarnings(agentIds);
    const earnings: Record<string, unknown> = {};
    map.forEach((value, key) => {
      earnings[key] = value;
    });

    return NextResponse.json({ earnings });
  } catch (error) {
    console.error("[api/admin/agents/batch-earnings] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to calculate earnings" },
      { status: 500 }
    );
  }
}
