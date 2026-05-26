import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

/** Ringing calls for the logged-in admin. */
export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const adminId = String(session.admin.id ?? "")
  const db = getAdminClient()

  const { data: ringingRow } = await db
    .from("call_sessions")
    .select("*")
    .eq("receiver_id", adminId)
    .eq("status", "ringing")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  let ringing = ringingRow
  if (ringingRow?.caller_id) {
    const { data: agent } = await db
      .from("agents")
      .select("full_name, agent_name, phone_number")
      .eq("id", ringingRow.caller_id)
      .maybeSingle()
    ringing = { ...ringingRow, agents: agent ?? null }
  }

  const { data: active } = await db
    .from("call_sessions")
    .select("*")
    .eq("receiver_id", adminId)
    .eq("status", "active")
    .maybeSingle()

  return NextResponse.json({
    success: true,
    ringing: ringing ?? null,
    active: active ?? null,
  })
}
