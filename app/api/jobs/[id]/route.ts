import { NextRequest, NextResponse } from "next/server";
import { getJobsSupabaseAdmin } from "@/lib/jobs-supabase-admin";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ message: "Missing job id" }, { status: 400 });
    }

    const supabase = getJobsSupabaseAdmin();
    const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single();

    if (error) {
      console.error(`[api/jobs/${id}] GET error:`, error);
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    return NextResponse.json({ job: data });
  } catch (error) {
    console.error("[api/jobs/[id]] GET failed:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
