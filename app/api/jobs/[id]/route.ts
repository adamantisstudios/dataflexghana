import { NextRequest, NextResponse } from "next/server";
import { getJobsSupabaseAdmin } from "@/lib/jobs-supabase-admin";
import { resolveJobBySegment } from "@/lib/jobs-resolve";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id: segment } = await context.params;
    if (!segment?.trim()) {
      return NextResponse.json({ message: "Missing job id" }, { status: 400 });
    }

    const supabase = getJobsSupabaseAdmin();
    const { job, error } = await resolveJobBySegment(supabase, segment);

    if (error) {
      return NextResponse.json({ message: error }, { status: 400 });
    }

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("[api/jobs/[id]] GET failed:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
