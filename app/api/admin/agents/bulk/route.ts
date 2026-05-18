import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

/** Reserved for future bulk agent operations (approve/suspend batches). */
export async function POST(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  return NextResponse.json(
    { success: false, error: "Bulk agent operations are not implemented on this endpoint yet." },
    { status: 501 },
  )
}
