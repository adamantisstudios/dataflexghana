import { NextResponse } from "next/server";
import { getJobsSupabaseAdmin } from "@/lib/jobs-supabase-admin";

export const dynamic = "force-dynamic";

/** Admin dashboard job counts from the external jobs database. */
export async function GET() {
  try {
    const supabase = getJobsSupabaseAdmin();

    const [totalRes, activeRes] = await Promise.all([
      supabase.from("jobs").select("id", { count: "exact", head: true }),
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);

    if (totalRes.error) {
      console.error("[api/jobs/stats] total error:", totalRes.error);
      return NextResponse.json({ message: totalRes.error.message }, { status: 400 });
    }

    return NextResponse.json({
      total: totalRes.count ?? 0,
      active: activeRes.count ?? 0,
    });
  } catch (error) {
    console.error("[api/jobs/stats] failed:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
