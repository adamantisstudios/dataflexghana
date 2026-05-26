import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getActiveCallSession } from "@/lib/call-sessions-server"

export const dynamic = "force-dynamic"

/** Returns whether support admin is free for a new call. */
export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) {
    return createAuthErrorResponse(auth.error || "Agent authentication required")
  }

  const active = await getActiveCallSession()
  return NextResponse.json({
    success: true,
    available: !active,
    activeCall: active
      ? { id: active.id, status: active.status, callerId: active.caller_id }
      : null,
  })
}
