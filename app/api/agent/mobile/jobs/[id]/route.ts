import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getJobsSupabaseAdmin } from "@/lib/jobs-supabase-admin"
import { resolveJobBySegment } from "@/lib/jobs-resolve"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  try {
    const { id: segment } = await context.params
    if (!segment?.trim()) {
      return NextResponse.json({ error: "Missing job id" }, { status: 400 })
    }

    const supabase = getJobsSupabaseAdmin()
    const { job, error } = await resolveJobBySegment(supabase, segment)

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, job })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load job"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
